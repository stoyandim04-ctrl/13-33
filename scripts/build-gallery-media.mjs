// Windows for the 3D gallery on the home page: every site in
// src/data/projects.ts gives several short muted clips (different parts of
// the page on a laptop, plus the phone view), each with a poster frame -
// recorded from the live sites while they scroll.
//
//   node scripts/build-gallery-media.mjs [slug ...]
//
// Output: public/gallery/<slug>-<n>.{mp4,webm,webp}, 768×480 (16:10). The
// phone clip is set on a blurred copy of itself, so every window has the
// same shape. Override an address with SITE_<SLUG>=url.
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "public", "gallery");
const executablePath = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium";

const DESK = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };
const CLIP = 7; // seconds per window
const CUTS = 3; // laptop windows per site
const W = 768;
const H = 480;

/** `wait`: intro before scrolling (ms). `speed`: wheel px per second.
    `scrollFor`: how long the laptop recording scrolls (ms). */
const SITES = {
  varovik: { url: "https://varovik.vercel.app", wait: 3000, speed: 1300, scrollFor: 24000 },
  tsukibi: { url: "https://tsukibi.vercel.app", wait: 5000, speed: 700, scrollFor: 24000 },
  obsidian: { url: "https://obsidian-sigma-mocha.vercel.app", wait: 2500, speed: 800, scrollFor: 24000 },
  "black-clove": { url: "https://black-clove-rho.vercel.app", wait: 2500, speed: 700, scrollFor: 24000 },
  // A phone-first site (one narrow column on a laptop too): every window is
  // the phone view.
  velion: { url: "https://velion-lab.com", wait: 2500, speed: 420, scrollFor: 26000, phoneOnly: true },
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

  const phoneVf =
    `split[a][b];[a]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},boxblur=24:2,eq=brightness=-0.22[bg];` +
    `[b]scale=-2:${H - 40}:flags=lanczos[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,fps=30`;

  if (site.phoneOnly) {
    const { webm, start } = await record(url, PHONE, site.wait, site.speed, site.scrollFor, true);
    const span = site.scrollFor / 1000;
    for (let i = 0; i <= CUTS; i++) {
      const ss = Math.max(0, start - (i === 0 ? 0.6 : 0) + (i * (span - CLIP)) / CUTS);
      encode(webm, ss, phoneVf, `${slug}-${i + 1}`);
    }
    continue;
  }

  // Laptop: one long scroll through the page, cut into CUTS windows.
  {
    const { webm, start } = await record(url, DESK, site.wait, site.speed, site.scrollFor);
    const span = site.scrollFor / 1000;
    for (let i = 0; i < CUTS; i++) {
      const ss = Math.max(0, start - (i === 0 ? 0.6 : 0) + (i * (span - CLIP)) / (CUTS - 1));
      encode(webm, ss, `scale=${W}:${H}:flags=lanczos,fps=30`, `${slug}-${i + 1}`);
    }
  }

  // Phone: the first screens, centred on a blurred, darkened copy.
  {
    const { webm, start } = await record(url, PHONE, site.wait, site.speed * 0.5, 9000, true);
    encode(webm, Math.max(0, start - 0.6), phoneVf, `${slug}-${CUTS + 1}`);
  }
}

await browser.close();
await fs.rm(work, { recursive: true, force: true });

async function record(url, viewport, wait, speed, scrollFor, phone = false) {
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    userAgent: phone
      ? "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
      : undefined,
    recordVideo: { dir: work, size: viewport },
  });
  const t0 = Date.now();
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
  await page.waitForTimeout(wait);
  await page.mouse.move(viewport.width / 2, viewport.height / 2);
  const start = (Date.now() - t0) / 1000;
  await scroll(page, (speed * scrollFor) / 1000, scrollFor);
  const video = page.video();
  await ctx.close();
  return { webm: await video.path(), start };
}

function encode(src, ss, vf, name) {
  const base = path.join(out, name);
  const at = ["-ss", ss.toFixed(2), "-i", src, "-t", String(CLIP)];
  ffmpeg([...at, "-vf", vf, "-c:v", "libx264", "-preset", "slow", "-crf", "29", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", "-an", `${base}.mp4`]);
  ffmpeg([...at, "-vf", vf, "-c:v", "libvpx-vp9", "-crf", "42", "-b:v", "0", "-row-mt", "1",
    "-deadline", "good", "-an", `${base}.webm`]);
  ffmpeg(["-i", `${base}.mp4`, "-frames:v", "1", "-c:v", "libwebp", "-quality", "80", `${base}.webp`]);
  const kb = async (f) => ((await fs.stat(f)).size / 1024).toFixed(0);
  Promise.all([kb(`${base}.mp4`), kb(`${base}.webm`)]).then(([a, b]) => console.log(`${name}: mp4 ${a} KB, webm ${b} KB`));
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
