// The colours of the gallery, chapter by chapter: the title, the wall,
// „За нас“ and the end (logo + the way in). The scene paints its background
// with them and the HTML on top (and the header) takes the same ink.
// `?palette=<key>` switches, so the candidates can be compared on the live
// preview; the choice is remembered.
import { CH, clamp01, seg, smooth } from "@/components/gallery/timeline";

export interface Tone {
  bg: string;
  ink: string;
  quiet: string;
  /** The action colour (the pill) and the text on it. */
  action: string;
  onAction: string;
  /** Glow in the background, lightly. */
  glow: string;
}

export interface Palette {
  key: string;
  name: string;
  hero: Tone;
  wall: Tone;
  about: Tone;
  end: Tone;
  /** The 3D logo: from → to. */
  logo: [string, string];
}

const PAPER: Palette = {
  key: "paper",
  name: "Светло",
  hero: { bg: "#E8E8EA", ink: "#111113", quiet: "#66666E", action: "#246BFF", onAction: "#FFFFFF", glow: "#FFFFFF" },
  wall: { bg: "#E8E8EA", ink: "#111113", quiet: "#66666E", action: "#246BFF", onAction: "#FFFFFF", glow: "#FFFFFF" },
  about: { bg: "#0A0D16", ink: "#F5F7FB", quiet: "#A3A9B8", action: "#246BFF", onAction: "#FFFFFF", glow: "#246BFF" },
  end: { bg: "#E8E8EA", ink: "#111113", quiet: "#66666E", action: "#246BFF", onAction: "#FFFFFF", glow: "#FFFFFF" },
  logo: ["#246BFF", "#44C8FF"],
};

/** Deep cobalt and ivory. */
const COBALT: Palette = {
  key: "cobalt",
  name: "Кобалт и слонова кост",
  hero: { bg: "#1A2BC4", ink: "#F3EDE2", quiet: "#B9C0F2", action: "#F3EDE2", onAction: "#1A2BC4", glow: "#3F5BFF" },
  wall: { bg: "#F3EDE2", ink: "#12163F", quiet: "#5E6286", action: "#1A2BC4", onAction: "#F3EDE2", glow: "#FFFFFF" },
  about: { bg: "#0B0F3A", ink: "#F3EDE2", quiet: "#A9AEDB", action: "#F3EDE2", onAction: "#0B0F3A", glow: "#2B45FF" },
  end: { bg: "#1A2BC4", ink: "#F3EDE2", quiet: "#B9C0F2", action: "#F3EDE2", onAction: "#1A2BC4", glow: "#3F5BFF" },
  logo: ["#F3EDE2", "#9FE3FF"],
};

/** Emerald, cream and gold. */
const EMERALD: Palette = {
  key: "emerald",
  name: "Изумруд и злато",
  hero: { bg: "#0E3A2C", ink: "#F2EAD8", quiet: "#A9BFAF", action: "#C9A45C", onAction: "#0E3A2C", glow: "#1F6B50" },
  wall: { bg: "#F2EAD8", ink: "#0E2A20", quiet: "#5F6B5F", action: "#0E3A2C", onAction: "#F2EAD8", glow: "#FFFFFF" },
  about: { bg: "#06211A", ink: "#F2EAD8", quiet: "#9DB3A5", action: "#C9A45C", onAction: "#06211A", glow: "#1F6B50" },
  end: { bg: "#0E3A2C", ink: "#F2EAD8", quiet: "#A9BFAF", action: "#C9A45C", onAction: "#0E3A2C", glow: "#1F6B50" },
  logo: ["#C9A45C", "#F2DDA6"],
};

/** Oxblood, blush and copper. */
const OXBLOOD: Palette = {
  key: "oxblood",
  name: "Бордо и мед",
  hero: { bg: "#5B0E1E", ink: "#F6E7DC", quiet: "#D6A9A8", action: "#E8A86C", onAction: "#3A0711", glow: "#8E1D33" },
  wall: { bg: "#F6E7DC", ink: "#3A0711", quiet: "#7A5A58", action: "#5B0E1E", onAction: "#F6E7DC", glow: "#FFFFFF" },
  about: { bg: "#22060C", ink: "#F6E7DC", quiet: "#C69C9B", action: "#E8A86C", onAction: "#22060C", glow: "#8E1D33" },
  end: { bg: "#5B0E1E", ink: "#F6E7DC", quiet: "#D6A9A8", action: "#E8A86C", onAction: "#3A0711", glow: "#8E1D33" },
  logo: ["#E8A86C", "#FFD9B5"],
};

/** A colour per chapter: ivory, cobalt, black, signal orange. */
const SIGNAL: Palette = {
  key: "signal",
  name: "Цветни глави",
  hero: { bg: "#F3EEE6", ink: "#111111", quiet: "#6B6660", action: "#FF4A1C", onAction: "#FFFFFF", glow: "#FFFFFF" },
  wall: { bg: "#2233E0", ink: "#FFFFFF", quiet: "#C3C9FF", action: "#FF4A1C", onAction: "#FFFFFF", glow: "#4A5BFF" },
  about: { bg: "#0B0B0F", ink: "#F3EEE6", quiet: "#A29D96", action: "#FF4A1C", onAction: "#FFFFFF", glow: "#2233E0" },
  end: { bg: "#FF4A1C", ink: "#111111", quiet: "#5A1E0E", action: "#111111", onAction: "#FFFFFF", glow: "#FF8A5C" },
  logo: ["#2233E0", "#5B9BFF"],
};

/** White and black, chapter by chapter (chosen 22.10.2026): white title,
    black wall, white „За нас“, black end. The logo is the one colour. */
const MONO: Palette = {
  key: "mono",
  name: "Бяло и черно",
  hero: { bg: "#FFFFFF", ink: "#0A0A0A", quiet: "#6E6E6E", action: "#0A0A0A", onAction: "#FFFFFF", glow: "#FFFFFF" },
  wall: { bg: "#0A0A0A", ink: "#FFFFFF", quiet: "#8F8F8F", action: "#FFFFFF", onAction: "#0A0A0A", glow: "#2A2A2A" },
  about: { bg: "#FFFFFF", ink: "#0A0A0A", quiet: "#6E6E6E", action: "#0A0A0A", onAction: "#FFFFFF", glow: "#FFFFFF" },
  end: { bg: "#0A0A0A", ink: "#FFFFFF", quiet: "#8F8F8F", action: "#FFFFFF", onAction: "#0A0A0A", glow: "#2A2A2A" },
  logo: ["#246BFF", "#44C8FF"],
};

export const PALETTES = [MONO, PAPER, COBALT, EMERALD, OXBLOOD, SIGNAL];

const KEY = "1333-palette";

function pick(): Palette {
  try {
    const q = new URLSearchParams(location.search).get("palette");
    if (q && PALETTES.some((p) => p.key === q)) localStorage.setItem(KEY, q);
    const k = localStorage.getItem(KEY);
    return PALETTES.find((p) => p.key === k) ?? MONO;
  } catch {
    return MONO;
  }
}

export const PALETTE = pick();

/** Weights of the four chapters at progress p (they sum to 1). */
export function chapterWeights(p: number): [number, number, number, number] {
  const toWall = smooth(seg(p, [CH.exit[1] - 0.03, CH.drop[0] + 0.03]));
  const toAbout = smooth(seg(p, CH.glitch));
  const toEnd = smooth(seg(p, [CH.about[1] - 0.005, CH.logo[0] + 0.025]));
  const hero = 1 - toWall;
  const wall = toWall * (1 - toAbout);
  const about = toAbout * (1 - toEnd);
  const end = toEnd;
  return [hero, wall, about, end];
}

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
const hex = (c: number[]) => "#" + c.map((v) => Math.round(clamp01(v) * 255).toString(16).padStart(2, "0")).join("");

/** The tone at progress p, blended between chapters. */
export function toneAt(p: number, pal = PALETTE): Tone {
  const w = chapterWeights(p);
  const tones = [pal.hero, pal.wall, pal.about, pal.end];
  const mix = (k: keyof Tone) => {
    const out = [0, 0, 0];
    tones.forEach((t, i) => rgb(t[k]).forEach((v, j) => (out[j] += v * w[i])));
    return hex(out);
  };
  return { bg: mix("bg"), ink: mix("ink"), quiet: mix("quiet"), action: mix("action"), onAction: mix("onAction"), glow: mix("glow") };
}

/** True when a colour is dark (for the header and the grain). */
export const isDark = (c: string) => {
  const [r, g, b] = rgb(c);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.45;
};

let applied = "";
/** Sets the page's colour tokens to a tone (only when it changed). */
export function applyTone(t: Tone) {
  const key = `${t.bg}${t.ink}${t.quiet}${t.action}${t.onAction}`;
  if (key === applied) return;
  applied = key;
  const st = document.documentElement.style;
  const [r, g, b] = rgb(t.ink).map((v) => Math.round(v * 255));
  st.setProperty("--color-background", t.bg);
  st.setProperty("--color-foreground", t.ink);
  st.setProperty("--color-muted-foreground", t.quiet);
  st.setProperty("--color-primary", t.action);
  st.setProperty("--color-primary-foreground", t.onAction);
  st.setProperty("--color-border", `rgb(${r} ${g} ${b} / 0.14)`);
  document.documentElement.classList.toggle("tone-dark", isDark(t.bg));
}

export function clearTone() {
  applied = "";
  const st = document.documentElement.style;
  for (const k of ["background", "foreground", "muted-foreground", "primary", "primary-foreground", "border"]) st.removeProperty(`--color-${k}`);
  document.documentElement.classList.remove("tone-dark");
}
