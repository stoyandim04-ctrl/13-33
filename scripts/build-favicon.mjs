// public/favicon.svg from the mark's outline (src/components/brand/logo-geometry.ts).
//   node --experimental-strip-types scripts/build-favicon.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { MARK_PATH, MARK_ASPECT, MARK_BLUE, MARK_CYAN } = await import(path.join(root, "src/components/brand/logo-geometry.ts"));
const pad = 0.28;
const w = MARK_ASPECT + pad * 2;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-(w - 1) / 2} ${w.toFixed(4)} ${w.toFixed(4)}"><defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="${MARK_BLUE}"/><stop offset="1" stop-color="${MARK_CYAN}"/></linearGradient></defs><rect x="${-pad}" y="${-(w - 1) / 2}" width="${w.toFixed(4)}" height="${w.toFixed(4)}" rx="${(w * 0.24).toFixed(4)}" fill="#080A0F"/><path d="${MARK_PATH}" fill="url(#g)"/></svg>\n`;
await fs.writeFile(path.join(root, "public/favicon.svg"), svg);
console.log("public/favicon.svg");
