// Poster + muted preview for the Tsukibi concept, recorded from the real site
// in sites/tsukibi (not from a mock-up).
//
//   cd sites/tsukibi && npm run build && npx vite preview --port 4173
//   node scripts/build-tsukibi-media.mjs [http://localhost:4173]
//
// Same sizes and ffmpeg settings as build-concept-media.mjs.
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = process.argv[2] || "http://localhost:4173";
const W = 1160;
const H = 800;
const executablePath = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium";
const out = path.join(root, "public", "projects", "tsukibi");
await fs.mkdir(out, { recursive: true });
const work = await fs.mkdtemp(path.join(os.tmpdir(), "1333-tsukibi-"));
const browser = await chromium.launch({ executablePath: (await exists(executablePath)) ? executablePath : undefined });

// Poster: the menu with the ingredient labels open.
{
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1.25 });
  const page = await ctx.newPage();
  await page.goto(`${base}/menu?dish=wagyu`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  await page.mouse.move(W / 2, H / 2);
  await page.waitForTimeout(1800);
  const png = path.join(work, "poster.png");
  await page.screenshot({ path: png });
  ffmpeg(["-i", png, "-c:v", "libwebp", "-quality", "82", path.join(out, "poster.webp")]);
  await ctx.close();
}

// Recording: labels on the plate, then two dishes rolled in with the wheel.
{
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: work, size: { width: W, height: H } } });
  const page = await ctx.newPage();
  await page.goto(`${base}/menu?dish=wagyu`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.mouse.move(W / 2 - 40, H / 2, { steps: 12 });
  await page.waitForTimeout(1900);
  await page.mouse.move(W - 120, 140, { steps: 8 });
  await page.mouse.wheel(0, 120);
  await page.waitForTimeout(1500);
  await page.mouse.wheel(0, 120);
  await page.waitForTimeout(1300);
  await page.getByRole("button", { name: /Добави към поръчката/ }).hover();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Добави към поръчката/ }).click();
  await page.waitForTimeout(1400);
  const video = page.video();
  await ctx.close();
  const webm = await video.path();
  ffmpeg([
    "-ss", "1.8", "-i", webm, "-t", "7.3",
    "-vf", "scale=960:-2:flags=lanczos,fps=30",
    "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", "-an", path.join(out, "preview.mp4"),
  ]);
  ffmpeg([
    "-ss", "1.8", "-i", webm, "-t", "7.3",
    "-vf", "scale=960:-2:flags=lanczos,fps=30",
    "-c:v", "libvpx-vp9", "-crf", "40", "-b:v", "0", "-row-mt", "1", "-deadline", "good",
    "-an", path.join(out, "preview.webm"),
  ]);
}

const sizes = await Promise.all(["poster.webp", "preview.mp4", "preview.webm"].map(async (f) => `${f} ${((await fs.stat(path.join(out, f))).size / 1024).toFixed(0)} KB`));
console.log(`tsukibi: ${sizes.join(", ")}`);
await browser.close();
await fs.rm(work, { recursive: true, force: true });

function ffmpeg(args) {
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });
}
async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}
