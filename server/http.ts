import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ZodError } from "zod";
import { DatabaseNotConfiguredError } from "./db.js";

/** An error whose message is safe to show to the user. */
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type Handler = (req: VercelRequest) => Promise<unknown>;

/** Wraps a method map into a Vercel function with JSON responses and uniform errors. */
export function route(handlers: Partial<Record<"GET" | "POST", Handler>>) {
  return async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Cache-Control", "no-store");
    const method = (req.method ?? "GET").toUpperCase() as "GET" | "POST";
    const run = handlers[method];
    if (!run) {
      res.setHeader("Allow", Object.keys(handlers).join(", "));
      return res.status(405).json({ error: "Method not allowed" });
    }
    try {
      const data = await run(req);
      return res.status(200).json(data);
    } catch (err) {
      if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
      if (err instanceof ZodError) {
        return res.status(400).json({ error: err.issues.map((i) => i.message).join("; ") });
      }
      if (err instanceof DatabaseNotConfiguredError) return res.status(503).json({ error: err.message });
      // Unexpected: keep details in the server log, not in the response.
      console.error(err);
      return res.status(500).json({ error: "Something went wrong. Please try again." });
    }
  };
}

/** Rounds to 2 decimals (avoids 0.1 + 0.2 style float noise in stock arithmetic). */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
