// Server-only configuration. These live in the Vercel project's environment,
// never in the browser bundle (no VITE_ prefix).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const env = {
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  anthropicKey: process.env.ANTHROPIC_API_KEY ?? "",
  studioPassword: process.env.STUDIO_PASSWORD ?? "",
  /** Shown to clients as who they are writing with. */
  studioName: process.env.STUDIO_NAME || "Основателят на 13:33",
  telegramToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  telegramChat: process.env.TELEGRAM_CHAT_ID ?? "",
  siteUrl: (process.env.SITE_URL || "").replace(/\/$/, ""),
};

export const BUCKET = "inquiry-files";

let client: SupabaseClient | null = null;
/** Service-role client - bypasses RLS, so only ever used here on the server. */
export function db(): SupabaseClient {
  if (!env.supabaseUrl || !env.supabaseKey) throw new HttpError(503, "not-configured");
  client ??= createClient(env.supabaseUrl, env.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
