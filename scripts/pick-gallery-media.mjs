// Keeps the chosen candidates of a site as its gallery windows, in order:
//   node scripts/pick-gallery-media.mjs varovik 1 2 3
// → public/gallery/varovik-c1.* becomes varovik-1.*, c2 → -2, c3 → -3; the
// other candidates are deleted. Set `windows` in projects.ts to the count.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "gallery");
const [slug, ...keep] = process.argv.slice(2);
const files = await fs.readdir(dir);
for (const f of files.filter((f) => f.startsWith(`${slug}-`) && !/-c\d/.test(f))) await fs.rm(path.join(dir, f));
for (const [i, k] of keep.entries()) {
  for (const ext of [".mp4", ".webm", ".webp", "@4k.webp"]) {
    await fs.rename(path.join(dir, `${slug}-c${k}${ext}`), path.join(dir, `${slug}-${i + 1}${ext}`));
  }
}
for (const f of await fs.readdir(dir)) if (f.startsWith(`${slug}-c`)) await fs.rm(path.join(dir, f));
console.log(`${slug}: kept ${keep.join(", ")}`);
