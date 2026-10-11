// Poster + muted preview for the portfolio projects that are real sites of
// ours (Obsidian, Strong Muse, Варовик, Black Clove), recorded from the live
// pages while they scroll - so the wheel shows each site in action.
//
//   node scripts/build-live-media.mjs [slug ...]
//
// Override a site's address with SITE_<SLUG>=url (dashes → underscores), e.g.
// a local preview of the Варовик branch:
//   SITE_VAROVIK=http://localhost:4173 node scripts/build-live-media.mjs varovik
//
// Same sizes and ffmpeg settings as build-concept-media.mjs.
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const W = 1160;
const H = 800;
const executablePath = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium";

/** `wait`: time for the intro before scrolling. `speed`: wheel px per second.
    `posterAt`: page scroll (px) for the poster frame. `lead`: seconds of the
    settled first screen kept before the scroll starts (negative skips into
    the scroll, past a slow start). The preview is LENGTH
    seconds from there. */
const LENGTH = 9;
const SITES = {
  obsidian: {
    url: "https://obsidian-sigma-mocha.vercel.app",
    wait: 2500, speed: 900, scrollFor: 11000, posterAt: 0, lead: 0.6,
  },
  "strong-muse": {
    url: "https://strong-muse.vercel.app",
    wait: 2200, speed: 380, scrollFor: 9500, posterAt: 0, lead: 0.6,
  },
  varovik: {
    url: "https://varovik.vercel.app",
    wait: 3000, speed: 1300, scrollFor: 13000, posterAt: 0, lead: -2.4,
  },
  "black-clove": {
    url: "https://black-clove-rho.vercel.app",
    wait: 2500, speed: 800, scrollFor: 11000, posterAt: 0, lead: 0.6,
  },
};

const only = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: (await exists(executablePath)) ? executablePath : undefined });
const work = await fs.mkdtemp(path.join(os.tmpdir(), "1333-live-"));

for (const [slug, site] of Object.entries(SITES)) {
  if (only.length && !only.includes(slug)) continue;
  const url = process.env[`SITE_${slug.toUpperCase().replace(/-/g, "_")}`] || site.url;
  const out = path.join(root, "public", "projects", slug);
  await fs.mkdir(out, { recursive: true });

  // Poster: the first screen once the intro has played.
  {
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1.25 });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(site.wait + 1500);
    if (site.posterAt) await scroll(page, site.posterAt, 1500);
    await page.mouse.move(W - 40, H - 40);
    const png = path.join(work, `${slug}.png`);
    await page.screenshot({ path: png });
    ffmpeg(["-i", png, "-c:v", "libwebp", "-quality", "82", path.join(out, "poster.webp")]);
    await ctx.close();
  }

  // Recording: let the intro play, then scroll through the page at an even pace.
  {
    const ctx = await browser.newContext({
      viewport: { width: W, height: H },
      recordVideo: { dir: work, size: { width: W, height: H } },
    });
    // The recording starts with the context, so measure from here to know
    // where the scroll begins in it.
    const t0 = Date.now();
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(site.wait);
    await page.mouse.move(W / 2, H / 2);
    const start = (Date.now() - t0) / 1000;
    await scroll(page, (site.speed * site.scrollFor) / 1000, site.scrollFor);
    const video = page.video();
    await ctx.close();
    const webm = await video.path();
    const ss = Math.max(0, start - site.lead).toFixed(2);
    const t = LENGTH;
    const vf = "scale=960:-2:flags=lanczos,fps=30";
    ffmpeg([
      "-ss", String(ss), "-i", webm, "-t", String(t), "-vf", vf,
      "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p",
      "-movflags", "+faststart", "-an", path.join(out, "preview.mp4"),
    ]);
    ffmpeg([
      "-ss", String(ss), "-i", webm, "-t", String(t), "-vf", vf,
      "-c:v", "libvpx-vp9", "-crf", "40", "-b:v", "0", "-row-mt", "1", "-deadline", "good",
      "-an", path.join(out, "preview.webm"),
    ]);
  }

  const sizes = await Promise.all(
    ["poster.webp", "preview.mp4", "preview.webm"].map(
      async (f) => `${f} ${((await fs.stat(path.join(out, f))).size / 1024).toFixed(0)} KB`,
    ),
  );
  console.log(`${slug}: ${sizes.join(", ")}`);
}

await browser.close();
await fs.rm(work, { recursive: true, force: true });

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
