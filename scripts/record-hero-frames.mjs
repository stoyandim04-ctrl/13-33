// The hero's scroll film: one of our sites, recorded as a sequence of still
// frames at desktop and at phone size, so the hero can scrub them with the
// page scroll on two screens (a browser window and a phone).
//
//   node scripts/record-hero-frames.mjs
//
// Each frame is the page at rest at an even step down its length: the page's
// clock is fake (Playwright's clock), so smooth-scroll and scroll-driven
// scenes are given page time to settle between frames however slowly this
// browser renders. Frames are written as WebP to public/hero/<site>-<size>/.
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const executablePath = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium";
const SITE = { slug: "obsidian", url: "https://obsidian-sigma-mocha.vercel.app", intro: 3500, reach: 0.72 };
const FRAMES = 72;
const STEP = 1000 / 30;

const SIZES = [
  { name: "desktop", viewport: { width: 1280, height: 800 }, scale: 1, out: 1100, quality: 62, mobile: false },
  { name: "mobile", viewport: { width: 390, height: 844 }, scale: 2, out: 560, quality: 60, mobile: true },
];

const browser = await chromium.launch({ executablePath });
for (const size of SIZES) {
  const work = await fs.mkdtemp(path.join(os.tmpdir(), `1333-hero-${size.name}-`));
  const out = path.join(root, "public", "hero", `${SITE.slug}-${size.name}`);
  await fs.rm(out, { recursive: true, force: true });
  await fs.mkdir(out, { recursive: true });

  const ctx = await browser.newContext({
    viewport: size.viewport,
    deviceScaleFactor: size.scale,
    isMobile: size.mobile,
    hasTouch: size.mobile,
  });
  const page = await ctx.newPage();
  await page.clock.install();
  await page.goto(SITE.url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 3000));
  await page.mouse.move(size.viewport.width / 2, size.viewport.height / 2);
  for (let t = 0; t < SITE.intro; t += STEP) await step(page);

  const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const reach = total * SITE.reach;
  let at = 0;
  const t0 = Date.now();
  for (let f = 0; f < FRAMES; f++) {
    const want = (reach * f) / (FRAMES - 1);
    const delta = want - at;
    if (delta > 0.5) {
      if (size.mobile) await page.evaluate((y) => window.scrollTo(0, y), want);
      else await page.mouse.wheel(0, delta);
      at = want;
    }
    // Page time to settle: smooth scroll and scroll-scrubbed scenes catch up.
    for (let i = 0; i < 20; i++) await step(page);
    await new Promise((r) => setTimeout(r, 40));
    await page.screenshot({ path: path.join(work, `f${String(f).padStart(3, "0")}.png`) });
  }
  const y = await page.evaluate(() => window.scrollY);
  console.log(`${size.name}: ${FRAMES} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s, page at ${Math.round(y)} of ${Math.round(total)} px`);
  await ctx.close();

  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-i", path.join(work, "f%03d.png"),
    "-vf", `scale=${size.out}:-2:flags=lanczos`, "-c:v", "libwebp", "-quality", String(size.quality),
    "-start_number", "0", path.join(out, "%03d.webp"),
  ]);
  const files = await fs.readdir(out);
  let bytes = 0;
  for (const f of files) bytes += (await fs.stat(path.join(out, f))).size;
  console.log(`${size.name}: ${files.length} files, ${(bytes / 1024).toFixed(0)} KB`);
  await fs.rm(work, { recursive: true, force: true });
}
await browser.close();

/** One frame of page time: the fake clock, then CSS animations by hand. */
async function step(page) {
  await page.clock.runFor(STEP);
  await page.evaluate((ms) => {
    for (const a of document.getAnimations()) {
      if (a.playState === "finished") continue;
      if (a.__vt === undefined) {
        a.__vt = Number(a.currentTime) || 0;
        a.pause();
      }
      a.__vt += ms;
      a.currentTime = a.__vt;
    }
  }, STEP);
}
