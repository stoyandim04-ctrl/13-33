// Windows for the 3D gallery on the home page, recorded from the live sites
// in src/data/projects.ts - the laptop view only.
//
//   node scripts/build-gallery-media.mjs [slug ...]
//
// For every site, STOPS places down the page give one candidate window each:
//   public/gallery/<slug>-c<k>@4k.webp  a 3840×2400 still at that place
//   public/gallery/<slug>-c<k>.webp     the same still, 1280×800
//   public/gallery/<slug>-c<k>.{mp4,webm}  7 s of the page scrolling on from
//                                          there, 1280×800 (plays on click)
// Keep the best ones as <slug>-<n>.* (scripts/pick-gallery-media.mjs) and set
// `windows` in projects.ts. Override an address with SITE_<SLUG>=url.
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "public", "gallery");
const executablePath = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium";

const VIEW = { width: 1440, height: 900 };
const K4 = 3840 / 1440; // device pixel ratio of the 4K stills
const CLIP = 7;
const STOPS = 5;

/** `wait`: intro (ms). `speed`: wheel px per second. `span`: seconds of
    scrolling the stops are spread over. `probe`: wait until the page scrolls. */
const SITES = {
  varovik: { url: "https://varovik.vercel.app", wait: 3000, speed: 1300, span: 22 },
  tsukibi: { url: "https://tsukibi.vercel.app", wait: 5000, speed: 700, span: 22 },
  obsidian: { url: "https://obsidian-sigma-mocha.vercel.app", wait: 2500, speed: 800, span: 22 },
  "black-clove": { url: "https://black-clove-rho.vercel.app", wait: 2500, speed: 700, span: 22 },
  velion: { url: "https://velion-lab.com", wait: 2500, speed: 600, span: 22 },
  feral: { url: "https://13-33-zver.vercel.app/?shot", wait: 8000, speed: 1800, span: 18, probe: true },
  vaelo: { url: "https://13-33-vaelo.vercel.app", wait: 4000, speed: 700, span: 22 },
  rosa: { url: "https://13-33-sites-88v2w108i-stoyandim04-8394s-projects.vercel.app", wait: 5000, speed: 800, span: 22 },
};

const only = process.argv.slice(2);
const browser = await chromium.launch({
  executablePath: (await exists(executablePath)) ? executablePath : undefined,
  args: ["--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"],
});
const work = await fs.mkdtemp(path.join(os.tmpdir(), "1333-gallery-"));
await fs.mkdir(out, { recursive: true });

for (const [slug, site] of Object.entries(SITES)) {
  if (only.length && !only.includes(slug)) continue;
  const url = process.env[`SITE_${slug.toUpperCase().replace(/-/g, "_")}`] || site.url;
  const stopAt = (k) => (k * site.span) / STOPS; // seconds of scrolling before stop k

  // Clips: one even scroll through the page, cut at every stop.
  {
    const ctx = await browser.newContext({ viewport: VIEW, recordVideo: { dir: work, size: VIEW } });
    const t0 = Date.now();
    const page = await ctx.newPage();
    await open(page, url, site);
    const start = (Date.now() - t0) / 1000;
    await scroll(page, site.speed * (site.span + CLIP), (site.span + CLIP) * 1000);
    const video = page.video();
    await ctx.close();
    const webm = await video.path();
    for (let k = 0; k < STOPS; k++) encodeClip(webm, start + stopAt(k), `${slug}-c${k + 1}`);
  }

  // Stills: the same places, in 4K, once the page has settled there.
  {
    const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: K4 });
    const page = await ctx.newPage();
    await open(page, url, site);
    for (let k = 0; k < STOPS; k++) {
      if (k > 0) await scroll(page, site.speed * (stopAt(k) - stopAt(k - 1)), (stopAt(k) - stopAt(k - 1)) * 1000);
      await page.mouse.move(VIEW.width - 30, VIEW.height - 30);
      await page.waitForTimeout(1800);
      const png = path.join(work, `${slug}-${k}.png`);
      await page.screenshot({ path: png });
      const base = path.join(out, `${slug}-c${k + 1}`);
      ffmpeg(["-i", png, "-c:v", "libwebp", "-quality", "84", `${base}@4k.webp`]);
      ffmpeg(["-i", png, "-vf", "scale=1280:800:flags=lanczos", "-c:v", "libwebp", "-quality", "82", `${base}.webp`]);
    }
    await ctx.close();
  }
  console.log(`${slug}: done`);
}

await browser.close();
await fs.rm(work, { recursive: true, force: true });

async function open(page, url, site) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
  await page.waitForTimeout(site.wait);
  await page.mouse.move(VIEW.width / 2, VIEW.height / 2);
  // The intro locks the scroll while the 3D scene loads: wait until a wheel
  // moves the page, then go back to the top and let it settle.
  if (site.probe) {
    for (let i = 0; i < 120 && (await page.evaluate(() => window.scrollY)) < 10; i++) {
      await page.mouse.wheel(0, 120);
      await page.waitForTimeout(250);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(2500);
  }
}

function encodeClip(src, ss, name) {
  const base = path.join(out, name);
  const at = ["-ss", Math.max(0, ss).toFixed(2), "-i", src, "-t", String(CLIP)];
  const vf = "scale=1280:800:flags=lanczos,fps=30";
  ffmpeg([...at, "-vf", vf, "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", "-an", `${base}.mp4`]);
  ffmpeg([...at, "-vf", vf, "-c:v", "libvpx-vp9", "-crf", "38", "-b:v", "0", "-row-mt", "1",
    "-deadline", "good", "-an", `${base}.webm`]);
}

/** Wheel the page by `px` over `ms`, in small even steps (works with Lenis and
    scroll-scrubbed scenes, which a scrollTo jump would skip). */
async function scroll(page, px, ms) {
  const step = 40;
  const n = Math.max(1, Math.round(ms / step));
  for (let i = 0; i < n; i++) {
    await page.mouse.wheel(0, px / n);
    await page.waitForTimeout(step);
  }
}
function ffmpeg(args) {
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });
}
async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}
