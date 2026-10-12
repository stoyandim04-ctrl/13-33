import { env } from "./env.js";

/** Optional push to the founder's phone (Telegram bot). Never blocks the client. */
export async function notify(text: string) {
  if (!env.telegramToken || !env.telegramChat) return;
  try {
    await fetch(`https://api.telegram.org/bot${env.telegramToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Telegram refuses messages over 4096 characters.
      body: JSON.stringify({ chat_id: env.telegramChat, text: text.length > 4000 ? `${text.slice(0, 3990)}…` : text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    // A missed notification is not worth failing the request for.
  }
}

export const studioLink = (number: number) =>
  env.siteUrl ? `${env.siteUrl}/studio?n=${number}` : `/studio?n=${number}`;
