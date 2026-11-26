// Local stand-in for Vercel's function runtime: serves ./api/*.ts on :3001
// using the very same handlers. Used with `npm run dev` / `npm run preview`
// (Vite proxies /api here). Not used on Vercel.
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

const port = Number(process.env.API_PORT ?? 3001);

createServer(async (incoming, outgoing) => {
  const url = new URL(incoming.url ?? "/", "http://localhost");
  const name = url.pathname.replace(/^\/api\//, "").replace(/\/+$/, "");
  if (!/^[a-z0-9-]+$/.test(name)) {
    outgoing.writeHead(404, { "Content-Type": "application/json" });
    return outgoing.end(JSON.stringify({ error: "Not found" }));
  }

  let body: unknown = undefined;
  if (incoming.method === "POST") {
    const chunks: Buffer[] = [];
    for await (const c of incoming) chunks.push(c as Buffer);
    const text = Buffer.concat(chunks).toString("utf8");
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      outgoing.writeHead(400, { "Content-Type": "application/json" });
      return outgoing.end(JSON.stringify({ error: "Invalid JSON" }));
    }
  }

  const req = {
    method: incoming.method,
    query: Object.fromEntries(url.searchParams),
    body,
    headers: incoming.headers,
  };
  const res = {
    statusCode: 200,
    setHeader: (k: string, v: string) => outgoing.setHeader(k, v),
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      outgoing.writeHead(this.statusCode, { "Content-Type": "application/json" });
      outgoing.end(JSON.stringify(data));
    },
  };

  try {
    const mod = await import(pathToFileURL(join(process.cwd(), "api", `${name}.ts`)).href);
    await mod.default(req, res);
  } catch (err) {
    console.error(err);
    outgoing.writeHead(500, { "Content-Type": "application/json" });
    outgoing.end(JSON.stringify({ error: "Handler failed to load" }));
  }
}).listen(port, "127.0.0.1", () => console.log(`API on http://127.0.0.1:${port}`));
