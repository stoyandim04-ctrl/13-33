// /api/ping - a click on one of the site's main buttons, sent to the founder's
// phone (see _lib/notify). Only known button names pass, so nobody can push
// arbitrary text through it; the browser sends each one at most once a visit.
//
//   POST {event:"start-hero"} -> "Клик: Започни проект (hero)"
import { body, handle, json, str } from "./_lib/http.js";
import { notify } from "./_lib/notify.js";

const LABELS: Record<string, string> = {
  "start-hero": "Започни проект (hero)",
  "start-header": "Започни проект (менюто горе)",
  "start-menu": "Започни проект (мобилното меню)",
  "start-contact": "Започни проект (контакти)",
  "path-steps": "избра въпросника",
  "path-chat": "избра AI консултанта",
  email: "имейла за контакт",
};

const label = (event: string) =>
  LABELS[event] ?? (/^project:[a-z0-9-]{1,40}$/.test(event) ? `проекта ${event.slice(8)}` : "");

export function POST(request: Request) {
  return handle(async () => {
    const { event, lang } = await body<{ event?: unknown; lang?: unknown }>(request, 500);
    const text = label(str(event, 60));
    if (!text) return json({ ok: false }, 400);
    await notify(`Клик: ${text}${str(lang, 2) === "en" ? " · EN" : ""}`);
    return json({ ok: true });
  });
}
