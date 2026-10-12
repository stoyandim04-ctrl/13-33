// Server-only configuration. These live in the Vercel project's environment,
// never in the browser bundle (no VITE_ prefix).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const env = {
  // Public project address (not a secret); the env var can override it.
  supabaseUrl: process.env.SUPABASE_URL || "https://fuqixmjvsalzemxrbslp.supabase.co",
  supabaseKey: (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim(),
  // Trimmed: keys pasted on a phone often carry a stray space or newline.
  anthropicKey: (process.env.ANTHROPIC_API_KEY ?? "").trim(),
  studioPassword: (process.env.STUDIO_PASSWORD ?? "").trim(),
  /** Shown to clients as who they are writing with. */
  studioName: process.env.STUDIO_NAME || "Основателят на 13:33",
  telegramToken: (process.env.TELEGRAM_BOT_TOKEN ?? "").trim(),
  telegramChat: (process.env.TELEGRAM_CHAT_ID ?? "").trim(),
  /** Stripe: the deposit is paid online. Secret key + the webhook's signing secret. */
  stripeKey: (process.env.STRIPE_SECRET_KEY ?? "").trim(),
  stripeWebhookSecret: (process.env.STRIPE_WEBHOOK_SECRET ?? "").trim(),
  /** Resend: e-mails to the client. From must be on a verified domain. */
  resendKey: (process.env.RESEND_API_KEY ?? "").trim(),
  mailFrom: (process.env.MAIL_FROM ?? "").trim(),
  mailReplyTo: (process.env.MAIL_REPLY_TO ?? "").trim(),
  siteUrl: (process.env.SITE_URL || "https://13-33-1gsb.vercel.app").replace(/\/$/, ""),
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
