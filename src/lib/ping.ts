import { projects } from "@/data/projects";

// Tells the founder's phone (Telegram, via /api/ping) when someone clicks one
// of the main buttons. A button opts in with `data-ping="<name>"` (names are
// listed in api/ping.ts); links to a project's live site and the contact
// e-mail are picked up on their own. Each click is sent once per visit.

const sent = new Set<string>();

function eventOf(target: Element): string | null {
  const tagged = target.closest<HTMLElement>("[data-ping]");
  if (tagged?.dataset.ping) return tagged.dataset.ping;
  const link = target.closest<HTMLAnchorElement>("a[href]");
  if (!link) return null;
  if (link.href.startsWith("mailto:")) return "email";
  const project = projects.find((p) => p.liveUrl && link.href.startsWith(p.liveUrl));
  return project ? `project:${project.slug}` : null;
}

export function listenForPings() {
  const onClick = (e: MouseEvent) => {
    // The founder's own panel is not a visitor.
    if (!(e.target instanceof Element) || location.pathname.startsWith("/studio")) return;
    const event = eventOf(e.target);
    if (!event || sent.has(event)) return;
    sent.add(event);
    const payload = JSON.stringify({ event, lang: document.documentElement.lang });
    // sendBeacon survives the page navigating away (new tab, mailto, route change).
    const blob = new Blob([payload], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/ping", blob))
      void fetch("/api/ping", { method: "POST", body: payload, keepalive: true }).catch(() => {});
  };
  document.addEventListener("click", onClick, { capture: true });
  return () => document.removeEventListener("click", onClick, { capture: true });
}
