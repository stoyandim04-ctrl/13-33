import { env } from "./env.js";

/**
 * E-mail to the client through Resend (RESEND_API_KEY, MAIL_FROM). Without the
 * key nothing is sent and nothing fails - the page and Telegram still work.
 */
export async function sendMail(to: string, subject: string, html: string) {
  if (!env.resendKey || !env.mailFrom) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.mailFrom, to: [to], reply_to: env.mailReplyTo || undefined, subject, html }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("resend", res.status, await res.text());
  } catch (error) {
    console.error("resend", error);
  }
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);

/** One plain, readable layout for every message. */
export function layout(title: string, lines: string[], action?: { label: string; href: string }) {
  const body = lines.map((l) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.55;color:#1a1a1a">${l}</p>`).join("");
  const button = action
    ? `<p style="margin:24px 0 0"><a href="${esc(action.href)}" style="display:inline-block;background:#8F7BFF;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px">${esc(action.label)}</a></p>`
    : "";
  return `<!doctype html><html lang="bg"><body style="margin:0;background:#f5f4fa;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:20px;padding:32px">
<p style="margin:0 0 20px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#6b6b80">13:33 — Digital Studio</p>
<h1 style="margin:0 0 18px;font-size:24px;line-height:1.25;color:#111">${esc(title)}</h1>
${body}${button}
</div></body></html>`;
}

export { esc };
