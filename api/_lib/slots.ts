import type { Availability } from "../../src/lib/inquiry-shared.js";

/** Offset (minutes) of a time zone at a given instant, e.g. +180 for Sofia in summer. */
function offset(at: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** The instant of a wall-clock time in the zone. */
function zoned(y: number, m: number, d: number, minutes: number, timeZone: string) {
  const guess = new Date(Date.UTC(y, m - 1, d, 0, minutes));
  return new Date(guess.getTime() - offset(guess, timeZone) * 60000);
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** Free slot start times (ISO) from now through `daysAhead`, minus taken ones. */
export function freeSlots(a: Availability, taken: Set<string>, now = new Date()) {
  const out: string[] = [];
  const earliest = now.getTime() + a.noticeHours * 3600_000;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: a.timeZone }).format(now); // YYYY-MM-DD
  const [y0, m0, d0] = today.split("-").map(Number);
  for (let i = 0; i <= a.daysAhead; i++) {
    const day = new Date(Date.UTC(y0, m0 - 1, d0 + i));
    const weekday = day.getUTCDay() || 7; // 1 = Monday … 7 = Sunday
    if (!a.weekdays.includes(weekday)) continue;
    for (let t = toMin(a.start); t + a.minutes <= toMin(a.end); t += a.minutes) {
      const at = zoned(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), t, a.timeZone);
      if (at.getTime() < earliest) continue;
      const iso = at.toISOString();
      if (!taken.has(iso)) out.push(iso);
    }
  }
  return out;
}

export function cleanAvailability(v: Partial<Availability>, base: Availability): Availability {
  const hhmm = (s: unknown, d: string) => (typeof s === "string" && /^\d{2}:\d{2}$/.test(s) ? s : d);
  const num = (n: unknown, d: number, lo: number, hi: number) =>
    typeof n === "number" && Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : d;
  return {
    timeZone: base.timeZone,
    weekdays: Array.isArray(v.weekdays)
      ? [...new Set(v.weekdays.filter((d) => Number.isInteger(d) && d >= 1 && d <= 7))].sort()
      : base.weekdays,
    start: hhmm(v.start, base.start),
    end: hhmm(v.end, base.end),
    minutes: num(v.minutes, base.minutes, 15, 120),
    daysAhead: num(v.daysAhead, base.daysAhead, 1, 60),
    noticeHours: num(v.noticeHours, base.noticeHours, 0, 168),
  };
}
