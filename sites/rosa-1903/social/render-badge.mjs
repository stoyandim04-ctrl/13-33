// Renders badge.html (the 13:33 pill for the reel) to a transparent PNG.
//   node social/render-badge.mjs
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const p = await b.newPage({ deviceScaleFactor: 1 });
await p.goto(new URL("./badge.html", import.meta.url).href);
await p.waitForTimeout(300);
// keep the soft shadow around the pill
const box = await p.locator(".pill").boundingBox();
const m = 36;
await p.screenshot({
  path: new URL("./out/badge.png", import.meta.url).pathname,
  omitBackground: true,
  clip: { x: box.x - m, y: box.y - m, width: box.width + 2 * m, height: box.height + 2 * m },
});
await b.close();
