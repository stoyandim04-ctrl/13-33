import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const port = 4175;
const url = `http://127.0.0.1:${port}`;
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--config",
    "apps/strong-muse/vite.config.ts",
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
    "--strictPort",
  ],
  { cwd: root, stdio: "pipe" },
);
let serverOutput = "";
server.stdout.on("data", (data) => {
  serverOutput += data;
});
server.stderr.on("data", (data) => {
  serverOutput += data;
});
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    if (server.exitCode !== null)
      throw new Error(`Preview failed: ${serverOutput}`);
    try {
      if ((await fetch(url)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert.ok(ready, `Preview not ready: ${serverOutput}`);
  const executablePath =
    process.env.CHROMIUM_PATH ||
    (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);
  browser = await chromium.launch({ executablePath, args: ["--no-sandbox"] });
  for (const width of [360, 390, 768, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const failedRequests = [];
    page.on("response", (response) => {
      if (response.status() >= 400)
        failedRequests.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(url, { waitUntil: "networkidle" });
    assert.equal(await page.locator("html").getAttribute("lang"), "bg");
    assert.equal(await page.title(), "Strong Muse — Бъди своето вдъхновение");
    assert.equal(await page.locator("h1").count(), 1);
    assert.equal(
      (await page.locator("h1").innerText()).replace(/\s+/g, " "),
      "СИЛАТА Е В ТЕБ. ДАЙ И ДВИЖЕНИЕ !",
    );
    assert.equal(await page.locator(".program-card").count(), 4);
    assert.equal(await page.locator(".planned-label").count(), 4);
    assert.equal(
      await page.getByRole("button", { name: /Купи|Плати|Запиши се/ }).count(),
      0,
    );
    assert.equal(
      await page.locator("input[type=email]").count(),
      0,
      "No collection before contact process is approved",
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `Horizontal overflow at ${width}`,
    );
    await page
      .getByRole("button", {
        name: "Виж подробности за MUSE START",
        exact: true,
      })
      .click();
    const dialog = page.locator(".program-dialog");
    await dialog.waitFor({ state: "visible" });
    assert.match(await dialog.innerText(), /4 седмици/);
    assert.match(await dialog.innerText(), /Програмата е в подготовка/);
    assert.equal(
      await page.evaluate(() =>
        document
          .querySelector(".program-dialog")
          .contains(document.activeElement),
      ),
      true,
    );
    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(() =>
        document
          .querySelector(".program-dialog")
          .contains(document.activeElement),
      ),
      true,
    );
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    assert.equal(
      await page
        .getByRole("button", {
          name: "Виж подробности за MUSE START",
          exact: true,
        })
        .evaluate((el) => el === document.activeElement),
      true,
    );
    if (width < 700) {
      const open = page.getByRole("button", { name: "Отвори менюто" });
      await open.click();
      await page.locator("#mobile-navigation").waitFor({ state: "visible" });
      await page.keyboard.press("Escape");
      await page.locator("#mobile-navigation").waitFor({ state: "hidden" });
      assert.equal(
        await open.evaluate((el) => el === document.activeElement),
        true,
      );
      await open.click();
      await page
        .locator("#mobile-navigation")
        .getByRole("link", { name: "Хранене" })
        .click();
      await page.locator("#mobile-navigation").waitFor({ state: "hidden" });
      assert.equal(new URL(page.url()).hash, "#nutrition");
    }
    const faq = page.getByText("Мога ли вече да се запиша?", { exact: true });
    await faq.click();
    assert.equal(
      await page.locator(".faq-list details").first().getAttribute("open"),
      "",
    );
    assert.deepEqual(errors, [], `Page errors at ${width}`);
    assert.deepEqual(failedRequests, [], `Failed assets at ${width}`);
    if (process.env.STRONG_MUSE_VISUAL_DIR) {
      // This optional directory contains only prototype screenshots, never credentials.
      mkdirSync(process.env.STRONG_MUSE_VISUAL_DIR, { recursive: true });
      await page.goto(url);
      await page.screenshot({
        path: `${process.env.STRONG_MUSE_VISUAL_DIR}/strong-muse-${width}.png`,
        fullPage: true,
      });
    }
    console.log(
      `PASS ${width}px: content, assets, overflow, dialog focus, keyboard, navigation, FAQ`,
    );
    await page.close();
  }
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
