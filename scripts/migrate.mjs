// Creates the tables and, on a brand-new database, loads the starting menu.
// Runs at the start of every `npm run build` (so on every Vercel deploy).
// Idempotent: the schema uses IF NOT EXISTS and the seed only runs when
// menu_items is empty. It never deletes or overwrites existing data.
import postgres from "postgres";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

if (!url) {
  console.warn(
    "[migrate] DATABASE_URL is not set, so the database step was skipped.\n" +
      "[migrate] Connect a Neon database to this Vercel project (Storage tab), then redeploy.",
  );
  process.exit(0);
}

const isLocal = /@(127\.0\.0\.1|localhost)[:/]/.test(url);
const sql = postgres(url, {
  ssl: isLocal ? false : "require",
  max: 1,
  connect_timeout: 30,
  onnotice: () => {},
});

async function withRetry(label, fn, attempts = 4) {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (err) {
      // A sleeping Neon database can refuse the first connection; retry a few times.
      const transient = ["CONNECT_TIMEOUT", "ECONNRESET", "ECONNREFUSED", "CONNECTION_CLOSED", "57P03"].includes(
        err?.code,
      );
      if (!transient || i >= attempts) throw err;
      console.warn(`[migrate] ${label}: ${err.code}, retrying (${i}/${attempts - 1})...`);
      await new Promise((r) => setTimeout(r, 2000 * i));
    }
  }
}

try {
  await withRetry("schema", () => sql.file(join(root, "db", "schema.sql")));
  console.log("[migrate] schema ready");

  const [{ n }] = await withRetry("count", () => sql`select count(*)::int as n from menu_items`);
  if (n === 0) {
    await sql.file(join(root, "db", "seed.sql"));
    console.log("[migrate] new database: loaded the starting menu, ingredients and recipes");
  } else {
    console.log(`[migrate] database already has ${n} menu items, leaving data as it is`);
  }
} catch (err) {
  console.error("[migrate] FAILED:", err?.code ?? "", err?.message ?? err);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
