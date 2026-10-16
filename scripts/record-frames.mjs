// Frame-stepped recording of the portfolio sites: poster + a smooth, even
// 30 fps preview for the wheel, however slow the browser renders them.
//
//   node scripts/record-frames.mjs [slug ...]
//
// A real-time screen recording drops frames whenever a page is heavy (3D,
// big images) - in the old previews about half the frames were repeats, so
// they stuttered on every device. Here the page's clock is fake (Playwright's
// clock: timers, requestAnimationFrame, performance.now), CSS animations and
// page videos are paused and stepped by hand, and every frame is a screenshot
// taken once the page has finished drawing it. Then ffmpeg joins them.
//
// Override a site's address with SITE_<SLUG>=url (dashes → underscores).
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const W = 1160;
const H = 800;
const FPS = 30;
const STEP = 1000 / FPS;
/** Page time handed to a site's own frame loop (?rec). */
let pageNow = 0;
const executablePath = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium";

/** `intro`: ms of page time before the first frame (loaders, intros).
    `hold`: seconds on the first screen before the scroll. `px`: how far the
    preview scrolls in total; it eases in and out. `length`: seconds. */
const SITES = {
  obsidian: { url: "https://obsidian-sigma-mocha.vercel.app", intro: 3500, hold: 0.5, px: 7500, length: 9 },
  // ?rec: the site's own frame loop waits for window.__step(now), one render per frame.
  feral: { url: "https://13-33-zver.vercel.app/?rec", intro: 10000, hold: 0.8, px: 6500, length: 9 },
  varovik: { url: "https://varovik.vercel.app", intro: 4000, hold: 0.5, px: 9000, length: 9 },
  "black-clove": { url: "https://black-clove-rho.vercel.app", intro: 3500, hold: 0.5, px: 7000, length: 9 },
  tsukibi: { url: "https://tsukibi.vercel.app", intro: 5500, hold: 0.5, px: 6500, length: 9 },
};

const only = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: (await exists(executablePath)) ? executablePath : undefined });

for (const [slug, site] of Object.entries(SITES)) {
  if (only.length && !only.includes(slug)) continue;
  const url = process.env[`SITE_${slug.toUpperCase().replace(/-/g, "_")}`] || site.url;
  const out = path.join(root, "public", "projects", slug);
  const work = await fs.mkdtemp(path.join(os.tmpdir(), `1333-${slug}-`));
  await fs.mkdir(out, { recursive: true });

  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.clock.install();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 3000)); // images and models, real time
  await page.mouse.move(W / 2, H / 2);
  // Let the intro play on page time, frame by frame.
  for (let t = 0; t < site.intro; t += STEP) await step(page, STEP, false);

  const frames = Math.round(site.length * FPS);
  const holdFrames = Math.round(site.hold * FPS);
  let scrolled = 0;
  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    // Scroll: eased from the end of the hold to the last frame.
    const p = f < holdFrames ? 0 : (f - holdFrames) / Math.max(1, frames - 1 - holdFrames);
    const want = site.px * easeInOut(Math.min(1, p));
    const delta = want - scrolled;
    if (delta > 0.5) {
      await page.mouse.wheel(0, delta);
      scrolled = want;
    }
    await step(page, STEP);
    await page.screenshot({ path: path.join(work, `f${String(f).padStart(4, "0")}.png`) });
    if (f === 0) await fs.copyFile(path.join(work, "f0000.png"), path.join(work, "poster.png"));
  }
  console.log(`${slug}: ${frames} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  await ctx.close();

  const input = ["-framerate", String(FPS), "-i", path.join(work, "f%04d.png")];
  const vf = "scale=1160:-2:flags=lanczos";
  ffmpeg(["-i", path.join(work, "poster.png"), "-c:v", "libwebp", "-quality", "82", path.join(out, "poster.webp")]);
  ffmpeg([
    ...input, "-vf", vf, "-c:v", "libx264", "-preset", "slow", "-crf", "25", "-pix_fmt", "yuv420p",
    "-g", "60", "-movflags", "+faststart", "-an", path.join(out, "preview.mp4"),
  ]);
  ffmpeg([
    ...input, "-vf", vf, "-c:v", "libvpx-vp9", "-crf", "42", "-b:v", "0", "-row-mt", "1", "-deadline", "good",
    "-g", "60", "-an", path.join(out, "preview.webm"),
  ]);
  const sizes = await Promise.all(
    ["poster.webp", "preview.mp4", "preview.webm"].map(
      async (n) => `${n} ${((await fs.stat(path.join(out, n))).size / 1024).toFixed(0)} KB`,
    ),
  );
  console.log(`${slug}: ${sizes.join(", ")}`);
  await fs.rm(work, { recursive: true, force: true });
}

await browser.close();

/** Advance the page by `ms`: the fake clock (timers, rAF), then every CSS
    animation and every playing video on the page by the same amount. */
async function step(page, ms, draw = true) {
  await page.clock.runFor(ms);
  pageNow += ms;
  await page.evaluate(async ([ms, now]) => {
    window.__step?.(now);
    for (const a of document.getAnimations()) {
      if (a.playState === "finished") continue;
      if (a.__vt === undefined) {
        a.__vt = Number(a.currentTime) || 0;
        a.pause();
      }
      a.__vt += ms;
      a.currentTime = a.__vt;
    }
    const seeks = [];
    for (const v of document.querySelectorAll("video")) {
      if (!v.duration) continue;
      if (!v.paused) v.pause();
      const next = (v.currentTime + ms / 1000) % v.duration;
      seeks.push(new Promise((r) => { v.addEventListener("seeked", r, { once: true }); setTimeout(r, 1500); }));
      v.currentTime = next;
    }
    await Promise.all(seeks);
  }, [ms, pageNow]);
  if (draw) await settle();
}

/** A moment of real time, so the compositor draws what the step changed. */
async function settle() {
  await new Promise((r) => setTimeout(r, 30));
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
function ffmpeg(args) {
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });
}
async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
