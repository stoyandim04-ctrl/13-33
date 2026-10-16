/**
 * Where the visitor came from, sent along with an inquiry so the studio knows
 * which post or ad brought it. Only what the visitor's own link carries:
 * UTM tags, the referring site's host and the first page of the visit.
 * Kept for this browser tab only (sessionStorage); never a cookie.
 */
export interface Source {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
  landing?: string;
}

const KEY = "1333-source";
const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

/** Called once when the site loads. A new tagged link replaces the old tags. */
export function captureSource() {
  try {
    const url = new URL(window.location.href);
    const tags: Source = {};
    for (const k of UTM) {
      const v = url.searchParams.get(k)?.trim().slice(0, 100);
      if (v) tags[k] = v;
    }
    let referrer = "";
    try {
      const host = document.referrer ? new URL(document.referrer).hostname : "";
      if (host && host !== url.hostname) referrer = host;
    } catch {
      /* no referrer */
    }
    const saved = getSource();
    const hasTags = Object.keys(tags).length > 0;
    if (Object.keys(saved).length && !hasTags) return;
    const next: Source = { ...tags, landing: url.pathname.startsWith("/zapitvane/") ? "/zapitvane" : url.pathname };
    if (referrer) next.referrer = referrer;
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage blocked: the inquiry simply goes without a source */
  }
}

export function getSource(): Source {
  try {
    const raw = sessionStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return parsed && typeof parsed === "object" ? (parsed as Source) : {};
  } catch {
    return {};
  }
}
