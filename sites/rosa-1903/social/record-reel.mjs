// Records the site as PNG frames for a 9:16 reel: a scripted, eased scroll
// through every scene at 30 fps. The page runs in film mode (`?film`), where
// fog, petals and the bottle follow `window.__filmClock`, advanced here by
// exactly one frame per screenshot, so the film plays at the right speed no
// matter how slowly each frame renders.
//
//   node social/record-reel.mjs http://localhost:3000 out/frames
//
// PLAYWRIGHT_MODULE and CHROMIUM_PATH override where playwright/chromium live.
import { mkdirSync } from "node:fs";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
const url = process.argv[2] ?? "http://localhost:3000";
const out = process.argv[3] ?? "social/out/frames";
const FPS = 30;
const W = 1440;
const H = 900;

// [seconds, scroll position in vh] — the camera path through the film
const PATH = [
  [0, 0],
  [2.6, 0], // hold on the opening line
  [6.2, 285], // dawn: dolly, the sky warms, the flash
  [12.6, 690], // harvest: petals → funnel → bottle → drops
  [15.2, 960], // distillation
  [21.4, 1480], // the bottle: exploded view, the click, the turn
  [26.6, 1940], // the three notes
  [29.2, 2140], // 1903
  [31.6, 2290], // finale
  [33.4, 2290], // hold on the name
];

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
function scrollAt(s) {
  for (let i = 0; i < PATH.length - 1; i++) {
    const [t0, v0] = PATH[i];
    const [t1, v1] = PATH[i + 1];
    if (s <= t1) return v0 + (v1 - v0) * easeInOut((s - t0) / (t1 - t0));
  }
  return PATH[PATH.length - 1][1];
}

mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--hide-scrollbars"],
});
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.goto(`${url}${url.includes("?") ? "&" : "?"}film`, { waitUntil: "networkidle" });
// the preloader, the curtain and the opening line play in real time, off camera
await page.waitForTimeout(9000);

const total = Math.min(Number(process.env.MAX_FRAMES ?? Infinity), Math.round(PATH[PATH.length - 1][0] * FPS));
for (let f = 0; f < total; f++) {
  const y = (scrollAt(f / FPS) / 100) * H;
  await page.evaluate(([top, t]) => {
    window.__filmClock = t;
    window.scrollTo(0, top);
  }, [y, f / FPS]);
  // let WebGL render this frame and sequence images land
  await page.waitForTimeout(140);
  await page.screenshot({ path: `${out}/${String(f).padStart(4, "0")}.png` });
  if (f % 60 === 0) console.log(`frame ${f}/${total}`);
}
await browser.close();
console.log("done");
