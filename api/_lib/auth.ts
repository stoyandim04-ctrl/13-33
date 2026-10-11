import { createHmac, timingSafeEqual } from "node:crypto";
import { env, HttpError } from "./env.js";

// The studio panel signs in with one password (STUDIO_PASSWORD). The browser
// keeps a token derived from it; changing the password signs everyone out.
const sign = (value: string) =>
  createHmac("sha256", env.studioPassword).update(value).digest("hex");

export function issueToken(password: string): string {
  if (!env.studioPassword) throw new HttpError(503, "not-configured");
  const a = Buffer.from(sign(password));
  const b = Buffer.from(sign(env.studioPassword));
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new HttpError(401, "wrong-password");
  return sign("13:33 studio");
}

export function requireStudio(request: Request) {
  if (!env.studioPassword) throw new HttpError(503, "not-configured");
  const header = request.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "");
  const want = sign("13:33 studio");
  if (token.length !== want.length || !timingSafeEqual(Buffer.from(token), Buffer.from(want))) {
    throw new HttpError(401, "unauthorized");
  }
}
