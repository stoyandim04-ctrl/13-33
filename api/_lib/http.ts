import { HttpError } from "./env.js";

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

/** Runs a handler and turns thrown HttpErrors (and anything else) into JSON. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status);
    console.error(error);
    return json({ error: "server-error" }, 500);
  }
}

export async function body<T>(request: Request, max = 200_000): Promise<T> {
  const text = await request.text();
  if (text.length > max) throw new HttpError(413, "too-large");
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError(400, "bad-json");
  }
}

/** Trimmed string, capped. */
export const str = (v: unknown, max = 2000) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

/** Storage paths a client may attach: their draft folder or their inquiry folder. */
export function cleanPaths(v: unknown, prefixes: string[]): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((p): p is string => typeof p === "string")
    .filter((p) => prefixes.some((pre) => p.startsWith(pre)) && !p.includes(".."))
    .slice(0, 12);
}

export const DRAFT_RE = /^[a-f0-9]{24,64}$/;
