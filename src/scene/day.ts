// One shared clock for the scene and the text over it: scroll progress (0..1)
// maps to an hour of the day, and the hour drives the sun, the sky and the
// windows. Kept free of three.js so the DOM side can import it cheaply.

/** Story beats: progress -> hour. Each beat is a chapter of the copy. */
export const BEATS = [
  { p: 0, hour: 6.5 },
  { p: 0.25, hour: 8 },
  { p: 0.5, hour: 12.5 },
  { p: 0.75, hour: 18 + 40 / 60 },
  { p: 1, hour: 20 + 40 / 60 },
] as const;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export function hourAt(p: number) {
  const v = clamp01(p);
  for (let i = 1; i < BEATS.length; i++) {
    const a = BEATS[i - 1];
    const b = BEATS[i];
    if (v <= b.p) return a.hour + ((v - a.p) / (b.p - a.p)) * (b.hour - a.hour);
  }
  return BEATS[BEATS.length - 1].hour;
}

export function formatHour(hour: number) {
  const total = Math.round(hour * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** 0 by day, 1 at night: how much the windows glow and the overlay inverts. */
export function nightAt(hour: number) {
  // a few windows still lit at first light; the whole house by nightfall
  return Math.max((1 - smoothstep(6, 7.2, hour)) * 0.2, smoothstep(18.6, 20.2, hour));
}
