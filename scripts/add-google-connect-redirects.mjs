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
  console.log("Add these redirect URIs if missing:");
  for (const uri of EXTRA_REDIRECTS) console.log(" ", uri);

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    channel: "chrome",
    headless: false,
    viewport: { width: 1400, height: 1000 },
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const page = context.pages()[0] || (await context.newPage());

  try {
    await page.goto(editUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await page.waitForTimeout(5000);

    const bodyText = await page.locator("body").innerText().catch(() => "");
    for (const uri of EXTRA_REDIRECTS) {
      if (bodyText.includes(uri)) {
        console.log("Already present:", uri);
        continue;
      }
      const addBtn = page.getByRole("button", { name: /add uri/i }).first();
      if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addBtn.click();
        await page.waitForTimeout(500);
      }
      const inputs = page.locator(
        'input[aria-label*="URI" i], input[aria-label*="redirect" i], input[placeholder*="https://" i]',
      );
      const n = await inputs.count();
      if (n === 0) {
        console.log("Could not find URI inputs — add manually in the open browser window.");
        break;
      }
      await inputs.nth(n - 1).fill(uri);
      console.log("Filled:", uri);
      await page.waitForTimeout(300);
    }

    const saveBtn = page.getByRole("button", { name: /save/i }).first();
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(2500);
      console.log("Clicked Save.");
    } else {
      console.log("Save button not found — review the open browser and click Save.");
    }

    console.log("Leave the browser open if you need to confirm scopes on the consent screen.");
    console.log(
      "Consent scopes: https://console.cloud.google.com/auth/scopes?project=splitsms",
    );
    await page.waitForTimeout(8000);
  } finally {
    await context.close().catch(() => undefined);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
