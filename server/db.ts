import postgres from "postgres";

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "The database is not connected yet. Connect a Neon database to this Vercel project (Storage tab) and redeploy.",
    );
  }
}

type Sql = ReturnType<typeof createClient>;

function createClient(url: string) {
  const isLocal = /@(127\.0\.0\.1|localhost)[:/]/.test(url);
  return postgres(url, {
    ssl: isLocal ? false : "require",
    // Serverless: one connection per function instance, released quickly.
    max: 1,
    idle_timeout: 10,
    connect_timeout: 30,
    // Neon's pooler runs in transaction mode, which has no prepared statements.
    prepare: false,
    // snake_case columns <-> camelCase keys, for results and for object inserts.
    transform: postgres.camel,
    types: {
      // numeric and bigint come back as strings by default; the UI wants numbers.
      numeric: { to: 1700, from: [1700], serialize: (x: unknown) => String(x), parse: (x: string) => Number(x) },
      bigint: { to: 20, from: [20], serialize: (x: unknown) => String(x), parse: (x: string) => Number(x) },
    },
  });
}

let client: Sql | undefined;

/** The shared SQL client. Throws DatabaseNotConfiguredError until DATABASE_URL exists. */
export function getSql(): Sql {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) throw new DatabaseNotConfiguredError();
  client ??= createClient(url);
  return client;
}
