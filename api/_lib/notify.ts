import { waitUntil } from "@vercel/functions";
import { BUCKET, db, env } from "./env.js";
import { fileName } from "./files.js";

/** Optional push to the founder's phone (Telegram bot). Never blocks the client. */
export async function notify(text: string) {
  if (!env.telegramToken || !env.telegramChat) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${env.telegramToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Telegram refuses messages over 4096 characters.
      body: JSON.stringify({ chat_id: env.telegramChat, text: text.length > 4000 ? `${text.slice(0, 3990)}…` : text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(4000),
    });
    // Shows up in Vercel's logs: a wrong token (401) or chat id (400) is the usual cause.
    if (!res.ok) console.error("telegram", res.status, await res.text());
  } catch {
    // A missed notification is not worth failing the request for.
  }
}

export const studioLink = (number: number) =>
  env.siteUrl ? `${env.siteUrl}/studio?n=${number}` : `/studio?n=${number}`;

/**
 * The client's photos and files, sent to the same chat as documents - so
 * Telegram keeps them in full quality instead of recompressing them as photos.
 * Runs after the response (waitUntil), so a big upload never slows the client.
 */
export function notifyFiles(paths: string[], caption: string) {
  if (!env.telegramToken || !env.telegramChat || !paths.length) return;
  waitUntil(
    (async () => {
      for (const path of paths) {
        try {
          const { data } = await db().storage.from(BUCKET).download(path);
          // Bots can upload up to 50 MB; anything bigger stays in /studio only.
          if (!data || data.size > 50_000_000) continue;
          const form = new FormData();
          form.append("chat_id", env.telegramChat);
          form.append("caption", caption.slice(0, 1000));
          form.append("disable_content_type_detection", "true");
          form.append("document", data, fileName(path));
          await fetch(`https://api.telegram.org/bot${env.telegramToken}/sendDocument`, {
            method: "POST",
            body: form,
            signal: AbortSignal.timeout(60_000),
          });
        } catch {
          // The file is still in the client's chat in /studio.
        }
      }
    })(),
  );
}
