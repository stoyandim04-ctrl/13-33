import { chromium } from "playwright";
const [out, kind, ...ps] = process.argv.slice(2);
const phone = kind === "phone";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--ignore-gpu-blocklist", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"] });
const ctx = await b.newContext(phone
  ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
  : { viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const logs = [];
page.on("console", (m) => logs.push(m.type() + ": " + m.text()));
page.on("pageerror", (e) => logs.push("ERR " + e.message));
await page.goto("http://localhost:4173/" + (process.env.Q || ""), { waitUntil: "networkidle" });
await page.waitForTimeout(3500);
for (const p of ps) {
  await page.evaluate((p) => {
    const s = document.querySelector("main section");
    const top = s.getBoundingClientRect().top + scrollY;
    window.scrollTo(0, top + Number(p) * (s.offsetHeight - innerHeight));
  }, p);
  await page.waitForTimeout(Number(process.env.WAIT || 2200));
  if (process.env.HOVER) { await page.mouse.move(...process.env.HOVER.split(",").map(Number)); await page.waitForTimeout(1200); }
  console.log(p, await page.evaluate(() => [scrollY, document.querySelector("main section").getBoundingClientRect().bottom]));
  await page.screenshot({ path: `${out}/${kind}-${p}.png` });
}
console.log(logs.slice(0, 20).join("\n"));
console.log("mode:", await page.evaluate(() => document.documentElement.className));
await b.close();
