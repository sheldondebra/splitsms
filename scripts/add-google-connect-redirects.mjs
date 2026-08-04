#!/usr/bin/env node
/**
 * Adds Integrations connect redirect URIs to the existing SplitSMS Web OAuth client.
 * Opens Google Cloud Console with Playwright (uses .tmp-google-oauth-profile if present).
 *
 * Usage: node scripts/add-google-connect-redirects.mjs
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROJECT = "splitsms";
const PROFILE_DIR = join(root, ".tmp-google-oauth-profile");
const EXTRA_REDIRECTS = [
  "http://localhost:3000/api/integrations/google/callback",
  "https://splitsms.com/api/integrations/google/callback",
  "https://www.splitsms.com/api/integrations/google/callback",
];

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

async function readInputValues(page) {
  const values = [];
  const inputs = page.locator("input[type='text'], input[type='url'], input:not([type])");
  const n = await inputs.count();
  for (let i = 0; i < n; i++) {
    const val = (await inputs.nth(i).inputValue().catch(() => "")).trim();
    if (val) values.push(val);
  }
  return values;
}

async function main() {
  const env = {
    ...parseEnvFile(join(root, ".env")),
    ...parseEnvFile(join(root, ".env.local")),
  };
  const clientId = env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID missing from .env");
  }

  mkdirSync(PROFILE_DIR, { recursive: true });
  spawnSync("gcloud", ["config", "set", "project", PROJECT, "--quiet"], {
    stdio: "ignore",
  });

  const editUrl = `https://console.cloud.google.com/apis/credentials/oauthclient/${encodeURIComponent(clientId)}?project=${PROJECT}`;
  console.log("Opening OAuth client editor…");
  console.log(editUrl);

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    channel: "chrome",
    headless: false,
    viewport: { width: 1400, height: 1100 },
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const page = context.pages()[0] || (await context.newPage());

  try {
    await page.goto(editUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await page.waitForTimeout(6000);

    await page
      .getByText("Authorized redirect URIs", { exact: false })
      .first()
      .scrollIntoViewIfNeeded()
      .catch(() => undefined);
    await page.waitForTimeout(400);

    for (const uri of EXTRA_REDIRECTS) {
      const current = await readInputValues(page);
      if (current.includes(uri)) {
        console.log("Already present:", uri);
        continue;
      }

      const addButtons = page.getByRole("button", { name: /add uri/i });
      const addCount = await addButtons.count();
      // Last "Add URI" belongs to Authorized redirect URIs (below JS origins).
      await addButtons.nth(addCount - 1).click();
      await page.waitForTimeout(600);

      const inputs = page.locator("input[type='text'], input[type='url'], input:not([type])");
      const n = await inputs.count();
      let filled = false;
      for (let i = n - 1; i >= 0; i--) {
        const input = inputs.nth(i);
        const val = (await input.inputValue().catch(() => "")).trim();
        const box = await input.boundingBox().catch(() => null);
        if (!box || box.y < 400) continue;
        if (val) continue;
        await input.fill(uri);
        await input.press("Tab");
        filled = true;
        console.log("Filled:", uri);
        break;
      }
      if (!filled) console.log("Could not fill:", uri);
      await page.waitForTimeout(300);
    }

    // Remove empty redirect rows that block Save.
    for (let pass = 0; pass < 8; pass++) {
      const inputs = page.locator("input[type='text'], input[type='url'], input:not([type])");
      const n = await inputs.count();
      let removed = false;
      for (let i = n - 1; i >= 0; i--) {
        const input = inputs.nth(i);
        const val = (await input.inputValue().catch(() => "")).trim();
        const box = await input.boundingBox().catch(() => null);
        if (!box || box.y < 400 || val !== "") continue;
        await page.mouse.click(box.x + box.width + 28, box.y + box.height / 2);
        removed = true;
        await page.waitForTimeout(350);
        break;
      }
      if (!removed) break;
    }

    await page.locator("body").click({ position: { x: 10, y: 10 } }).catch(() => undefined);
    await page.waitForTimeout(800);

    const saveBtn = page.getByRole("button", { name: /^save$/i }).first();
    if (await saveBtn.isEnabled().catch(() => false)) {
      await saveBtn.click({ force: true });
      await page.waitForTimeout(4000);
      console.log("Clicked Save.");
    } else {
      console.log("Save button disabled — review the open browser and click Save.");
      await page.waitForTimeout(20_000);
    }

    await page.goto(editUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await page.waitForTimeout(5000);
    const after = await readInputValues(page);
    for (const uri of EXTRA_REDIRECTS) {
      console.log(after.includes(uri) ? `OK: ${uri}` : `MISSING: ${uri}`);
    }
  } finally {
    await context.close().catch(() => undefined);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
