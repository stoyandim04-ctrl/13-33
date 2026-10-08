// Renders a poster (webp) and a short muted scroll recording (mp4) for every
// concept mock-up into public/projects/<slug>/.
//
//   npm run media                 # all
//   npm run media -- sfera-portal # one
//
// Needs Playwright's Chromium (CHROMIUM_PATH to override) and ffmpeg on PATH.
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

import { mocks } from "./concept-mocks.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const W = 1160;
const H = 800; // 1.45 - the WorksWheel card ratio
const executablePath = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium";

const only = process.argv.slice(2);
const work = await fs.mkdtemp(path.join(os.tmpdir(), "1333-media-"));
const browser = await chromium.launch({ executablePath: (await exists(executablePath)) ? executablePath : undefined });

for (const mock of mocks.filter((m) => !only.length || only.includes(m.slug))) {
  const out = path.join(root, "public", "projects", mock.slug);
  await fs.mkdir(out, { recursive: true });
  const file = path.join(work, `${mock.slug}.html`);
  await fs.writeFile(file, mock.html);

  // Poster: settled first frame, at 1.25x for crisp cards.
  {
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1.25 });
    const page = await ctx.newPage();
    await page.goto(`file://${file}`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(2200);
    const png = path.join(work, `${mock.slug}.png`);
    await page.screenshot({ path: png });
    ffmpeg(["-i", png, "-c:v", "libwebp", "-quality", "82", path.join(out, "poster.webp")]);
    await ctx.close();
  }

  // Recording: let the intro play, then a slow eased scroll with a pause.
  {
    const ctx = await browser.newContext({
      viewport: { width: W, height: H },
      recordVideo: { dir: work, size: { width: W, height: H } },
    });
    const page = await ctx.newPage();
    await page.goto(`file://${file}`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1600);
    await page.evaluate(async () => {
      const max = Math.min(document.documentElement.scrollHeight - innerHeight, 1500);
      const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      const run = (from, to, ms) =>
        new Promise((resolve) => {
          const t0 = performance.now();
          const tick = (now) => {
            const t = Math.min(1, (now - t0) / ms);
            window.scrollTo(0, from + (to - from) * ease(t));
            if (t < 1) requestAnimationFrame(tick);
            else resolve();
          };
          requestAnimationFrame(tick);
        });
      await run(0, max * 0.5, 2600);
      await new Promise((r) => setTimeout(r, 700));
      await run(max * 0.5, max, 2600);
      await new Promise((r) => setTimeout(r, 600));
    });
    const video = page.video();
    await ctx.close();
    const webm = await video.path();
    ffmpeg([
      "-ss", "1.1", "-i", webm, "-t", "7.3",
      "-vf", "scale=960:-2:flags=lanczos,fps=30",
      "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p",
      "-movflags", "+faststart", "-an", path.join(out, "preview.mp4"),
    ]);
    // VP9 copy for browsers built without H.264 (e.g. some Chromium builds).
    ffmpeg([
      "-ss", "1.1", "-i", webm, "-t", "7.3",
      "-vf", "scale=960:-2:flags=lanczos,fps=30",
      "-c:v", "libvpx-vp9", "-crf", "40", "-b:v", "0", "-row-mt", "1", "-deadline", "good",
      "-an", path.join(out, "preview.webm"),
    ]);
  }
  const sizes = await Promise.all(["poster.webp", "preview.mp4", "preview.webm"].map(async (f) => `${f} ${((await fs.stat(path.join(out, f))).size / 1024).toFixed(0)} KB`));
  console.log(`${mock.slug}: ${sizes.join(", ")}`);
}

await browser.close();
await fs.rm(work, { recursive: true, force: true });

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
