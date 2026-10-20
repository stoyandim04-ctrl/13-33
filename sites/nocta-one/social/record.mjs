// Frame-exact recording: page time is virtual, every frame advances it by
// 1/FPS and the scroll progress follows a smooth curve.
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || "playwright");
const [,, out, secs = "24", fps = "30", from = "0", to = "-1", w = "1920", h = "1080"] = process.argv;
const FPS = +fps, N = Math.round(+secs * FPS), DT = 1000 / FPS;
const last = +to < 0 ? N : +to;
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
// virtual time: flows normally while loading, then only moves when we say
await page.addInitScript(() => {
  const realNow = performance.now.bind(performance);
  const realDate = Date.now;
  const d0 = realDate();
  let frozen = false, vt = 0;
  performance.now = () => (frozen ? vt : realNow());
  Date.now = () => d0 + performance.now();
  window.__vt = {
    freeze() { vt = realNow(); frozen = true; },
    advance(ms) { vt += ms; },
  };
});
await page.goto("http://localhost:3100/?tier=" + (process.env.TIER || "high") + "", { waitUntil: "load" });
await page.waitForFunction(() => !document.querySelector(".preloader"), null, { timeout: 120000 });
await page.waitForTimeout(2500);
await page.evaluate(() => window.__vt.freeze());
const settle = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(0)))));
// scroll curve: a short still on the hero, then an even glide with soft ends
const ease = (t) => {
  if (t < 0.06) return 0;
  if (t > 0.97) return 1;
  const u = (t - 0.06) / 0.91;
  const s = u * u * (3 - 2 * u);
  return s * 0.25 + u * 0.75;
};
const t0 = Date.now();
// a part starting mid-film warms up for a second so headline animations are in step
const start = Math.max(0, +from - (+process.env.WARM || 30));
await page.evaluate((ms) => window.__vt.advance(ms), start * DT);
for (let f = start; f < last; f++) {
  const p = ease(f / (N - 1)) % 1;
  await page.evaluate((p) => window.__nocta.seek(p), p);
  await page.evaluate((ms) => window.__vt.advance(ms), DT);
  await settle();
  if (f >= +from) await page.screenshot({ path: `${out}/f_${String(f).padStart(4, "0")}.png` });
  if (f % 60 === 0) console.log("frame", f, ((Date.now() - t0) / 1000).toFixed(0) + "s");
}
console.log("done", last - +from, "frames; errors:", errs.length ? errs.slice(0, 3) : "none");
await browser.close();
