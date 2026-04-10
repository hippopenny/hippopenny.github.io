/**
 * Browser E2E for pull simulator. Requires built site in _site and a static server.
 *
 *   npx --yes http-server _site -p 4173 -c-1
 *   npm run test:pull-e2e
 */
import assert from "assert";
import { chromium } from "playwright";

const BASE = process.env.PULL_SIM_BASE || "http://127.0.0.1:4173";
const STORAGE_GI = "hippo-pull-simulator/v1:genshin-impact";
const STORAGE_HSR = "hippo-pull-simulator/v1:honkai-star-rail";

async function main() {
  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${BASE}/pulls/genshin-impact/`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector(".pull-shell", { timeout: 20000 });

  await page.evaluate((key) => localStorage.removeItem(key), STORAGE_GI);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector(".pull-shell", { timeout: 20000 });

  const walletText = await page.locator('[data-role="wallet"]').innerText();
  assert.ok(/Primogems/i.test(walletText), "wallet shows currency name");
  assert.ok(/\d/.test(walletText), "wallet shows a number");

  let stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_GI);
  assert.strictEqual(
    stored,
    null,
    "no localStorage write until first interaction"
  );

  await page.click('[data-action="pull-ten"]');
  await page.waitForFunction(
    (key) => {
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      try {
        return JSON.parse(raw).totalPulls === 10;
      } catch {
        return false;
      }
    },
    STORAGE_GI,
    { timeout: 5000 }
  );

  stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_GI);
  let state = JSON.parse(stored);
  assert.strictEqual(state.totalPulls, 10);
  assert.strictEqual(state.premiumCurrency, 0);
  assert.ok(state.recentResults.length >= 1);
  assert.ok(page.url().includes("banner="), "URL syncs banner query");

  await page.selectOption('[data-role="banner-select"]', "nahida");
  await page.waitForFunction(
    (key) => {
      const raw = localStorage.getItem(key);
      return raw && JSON.parse(raw).activeBannerId === "nahida";
    },
    STORAGE_GI,
    { timeout: 5000 }
  );
  assert.ok(page.url().includes("banner=nahida"));

  const second = await context.newPage();
  await second.goto(`${BASE}/pulls/honkai-star-rail/`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await second.waitForSelector(".pull-shell", { timeout: 20000 });
  const giFromHsrTab = await second.evaluate((k) => localStorage.getItem(k), STORAGE_GI);
  assert.strictEqual(
    JSON.parse(giFromHsrTab).totalPulls,
    10,
    "Genshin pulls unchanged while visiting HSR (separate keys; shared origin)"
  );
  assert.strictEqual(
    await second.evaluate((k) => localStorage.getItem(k), STORAGE_HSR),
    null,
    "HSR has not persisted yet (no interaction)"
  );

  await page.bringToFront();
  const currencyBeforeReset = JSON.parse(
    await page.evaluate((key) => localStorage.getItem(key), STORAGE_GI)
  ).premiumCurrency;
  await page.click('[data-action="reset-session"]');
  await page.waitForFunction(
    (key) => {
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      const s = JSON.parse(raw);
      return s.totalPulls === 0 && s.recentResults.length === 0;
    },
    STORAGE_GI,
    { timeout: 5000 }
  );

  stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_GI);
  state = JSON.parse(stored);
  assert.strictEqual(state.totalPulls, 0);
  assert.strictEqual(state.premiumCurrency, currencyBeforeReset, "reset keeps wallet");
  assert.strictEqual(state.activeBannerId, "nahida", "reset keeps current tab");

  const pullOne = page.locator('[data-action="pull-one"]');
  await page.waitForFunction(() => {
    const b = document.querySelector('[data-action="pull-one"]');
    return b && b.disabled;
  });
  assert.strictEqual(await pullOne.isDisabled(), true, "no gems → ×1 disabled");

  const ctx2 = await browser.newContext();
  const p2 = await ctx2.newPage();
  await p2.goto(`${BASE}/pulls/genshin-impact/`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await p2.waitForSelector(".pull-shell", { timeout: 20000 });
  await p2.evaluate((key) => localStorage.removeItem(key), STORAGE_GI);
  await p2.reload({ waitUntil: "domcontentloaded" });
  await p2.waitForSelector(".pull-shell", { timeout: 20000 });
  await p2.click('[data-action="pull-one"]');
  await p2.waitForFunction(
    (key) => {
      const raw = localStorage.getItem(key);
      return raw && JSON.parse(raw).totalPulls === 1;
    },
    STORAGE_GI,
    { timeout: 5000 }
  );
  state = JSON.parse(await p2.evaluate((key) => localStorage.getItem(key), STORAGE_GI));
  assert.strictEqual(state.premiumCurrency, 1600 - 160);
  await ctx2.close();

  await browser.close();
  console.log("pull-simulator.e2e.mjs: all browser checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
