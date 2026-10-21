import { chromium } from "playwright";
const out = process.argv[2];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--enable-unsafe-swiftshader"] });
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
await page.evaluate(() => { const s = document.querySelector("main section"); window.scrollTo(0, 0.47 * (s.offsetHeight - innerHeight)); });
await page.waitForTimeout(4000);
for (const [x, y] of [[400, 320], [450, 350], [470, 360]]) { await page.mouse.move(x, y, { steps: 5 }); await page.waitForTimeout(400); }
await page.waitForTimeout(1500);
await page.screenshot({ path: out + "/hover.png", clip: { x: 300, y: 250, width: 420, height: 230 } });
await page.mouse.click(470, 360);
await page.waitForTimeout(4000);
await page.mouse.move(1400, 880);
await page.waitForTimeout(1500);
await page.screenshot({ path: out + "/click.png", clip: { x: 300, y: 250, width: 420, height: 230 } });
await page.waitForTimeout(2500);
await page.screenshot({ path: out + "/click2.png", clip: { x: 300, y: 250, width: 420, height: 230 } });
await page.screenshot({ path: out + "/clickfull.png" });

await b.close();
