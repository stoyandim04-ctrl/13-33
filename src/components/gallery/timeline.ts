// The gallery's story, as stretches of one scroll progress 0 → 1. The scene
// (scene.ts) and the HTML layers on top of it (gallery.tsx) read the same
// stretches, so the words and the 3D always move together.

export type Span = readonly [number, number];

export const CH = {
  /** The title with the ribbon running through it. */
  hero: [0, 0.05],
  /** The ribbon turns into a diagonal, then curls around the camera. */
  dive: [0.05, 0.13],
  /** Close to the windows: they keep sliding past. */
  close: [0.13, 0.27],
  /** The ribbon pulls away, the title comes back and goes. */
  exit: [0.27, 0.33],
  /** Windows fall in one by one, then snap into the wall. */
  drop: [0.33, 0.43],
  /** The wall: hover / tap a window, open its site. */
  wall: [0.43, 0.58],
  /** Glitch into the deeper dark. */
  glitch: [0.58, 0.62],
  /** About: the globe of windows behind the words. */
  about: [0.62, 0.79],
  /** The logo comes forward, turns, and flies back to its corner. */
  logo: [0.79, 0.87],
  /** The way in. */
  cta: [0.87, 1],
} as const satisfies Record<string, Span>;

/** Scroll length of the whole story, in screen heights. */
export const LENGTH = { desktop: 11, phone: 10 } as const;

/** Where an anchor (#proekti, #za-nas, #kontakt) lands, as a progress. */
export const ANCHOR = { proekti: 0.47, "za-nas": 0.68, kontakt: 0.93 } as const;

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const seg = (p: number, [a, b]: Span) => clamp01((p - a) / (b - a));
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** 0 outside the span, 1 inside, with soft edges `fade` long. */
export function within(p: number, [a, b]: Span, fade = 0.02) {
  return smooth(clamp01((p - a + fade) / fade)) * smooth(clamp01((b + fade - p) / fade));
}

/** How dark the scene is: light paper, the dark of „За нас“, light again. */
export const moodAt = (p: number) =>
  smooth(seg(p, CH.glitch)) * (1 - smooth(seg(p, [CH.about[1] - 0.005, CH.logo[0] + 0.025])));
