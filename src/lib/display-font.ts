// The display serif for the big words. Two candidates, both condensed-looking
// serifs with the Bulgarian Cyrillic forms (cyrl/BGR locl): Playfair (A, the
// default, at its narrowest width) and Cormorant (B). `?font=b` / `?font=a`
// switches and remembers the choice, so the two can be compared on the live
// preview before one is kept.
import "@fontsource-variable/playfair/standard.css";

export interface DisplayFont {
  key: "a" | "b";
  /** CSS font-family. */
  family: string;
  weight: number;
  /** CSS font-stretch keyword. */
  stretch: string;
}

const A: DisplayFont = { key: "a", family: '"Playfair Variable", Georgia, serif', weight: 460, stretch: "semi-condensed" };
const B: DisplayFont = { key: "b", family: '"Cormorant Variable", Georgia, serif', weight: 500, stretch: "normal" };

const KEY = "1333-font";

function pick(): DisplayFont {
  try {
    const q = new URLSearchParams(location.search).get("font");
    if (q === "a" || q === "b") localStorage.setItem(KEY, q);
    return localStorage.getItem(KEY) === "b" ? B : A;
  } catch {
    return A;
  }
}

export const DISPLAY = pick();

/** Loads the chosen face and exposes it to CSS (`font-serif`). */
export async function setupDisplayFont() {
  if (DISPLAY.key === "b") await import("@fontsource-variable/cormorant/index.css");
  const root = document.documentElement.style;
  root.setProperty("--font-serif-face", DISPLAY.family);
  root.setProperty("--serif-stretch", DISPLAY.stretch);
  root.setProperty("--serif-weight", String(DISPLAY.weight));
}

/** A canvas `font` string in the display face. */
export const displayCanvasFont = (px: number) =>
  `${DISPLAY.weight} ${DISPLAY.stretch} ${px}px ${DISPLAY.family}`;
