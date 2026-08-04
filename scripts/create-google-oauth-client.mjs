#!/usr/bin/env node
/**
 * Create a Google Auth Platform Web OAuth client for SplitSMS via Playwright,
 * then write GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET into .env (never prints full secrets).
 *
 * Usage: node scripts/create-google-oauth-client.mjs
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROJECT = "splitsms";
const APP_NAME = "SplitSMS Web";
const REDIRECTS = [
  "http://localhost:3000/api/auth/google/callback",
  "https://splitsms.com/api/auth/google/callback",
  "https://www.splitsms.com/api/auth/google/callback",
  "http://localhost:3000/api/integrations/google/callback",
  "https://splitsms.com/api/integrations/google/callback",
  "https://www.splitsms.com/api/integrations/google/callback",
];
const PROFILE_DIR = join(root, ".tmp-google-oauth-profile");
const ENV_PATH = join(root, ".env");

function upsertEnv(updates) {
  let text = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf8") : "";
  if (text && !text.endsWith("\n")) text += "\n";
  for (const [key, value] of Object.entries(updates)) {
    const line = `${key}=${value}`;
    const re = new RegExp(`^${key}=.*$`, "m");
    if (re.test(text)) text = text.replace(re, line);
    else text += `${line}\n`;
  }
  writeFileSync(ENV_PATH, text);
}

function mask(value) {
  if (!value) return "(empty)";
  if (value.length <= 10) return "***";
  return `${value.slice(0, 6)}…${value.slice(-4)} (len=${value.length})`;
}

async function extractCreds(page) {
  const body = await page.locator("body").innerText();
  const clientId = (body.match(/[0-9]+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com/) || [])[0] || "";
  const clientSecret = (body.match(/GOCSPX-[a-zA-Z0-9_-]+/) || [])[0] || "";
  return { clientId, clientSecret };
}

async function main() {
  mkdirSync(PROFILE_DIR, { recursive: true });
  spawnSync("gcloud", ["config", "set", "project", PROJECT, "--quiet"], { stdio: "ignore" });

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    channel: "chrome",
    headless: false,
    viewport: { width: 1400, height: 1000 },
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const page = context.pages()[0] || (await context.newPage());

  try {
    console.log("Opening Google Auth Platform create client…");
    await page.goto(
      `https://console.cloud.google.com/auth/clients/create?project=${PROJECT}`,
      { waitUntil: "domcontentloaded", timeout: 120_000 },
    );
    await page.waitForTimeout(4000);

    // Application type dropdown (Material / custom select under the label)
    const appTypeLabel = page.getByText("Application type", { exact: false }).first();
    await appTypeLabel.waitFor({ state: "visible", timeout: 30_000 });
    const box = await appTypeLabel.boundingBox();
    if (!box) throw new Error("Could not locate Application type field");

    // Click the control under the label
    await page.mouse.click(box.x + Math.min(200, box.width / 2), box.y + box.height + 28);
    await page.waitForTimeout(800);

    // Choose Web application from the open menu
    const web = page.getByText("Web application", { exact: true }).first();
    if (await web.isVisible({ timeout: 5000 }).catch(() => false)) {
      await web.click();
    } else {
      // Keyboard fallback: type ahead
      await page.keyboard.type("Web");
      await page.keyboard.press("Enter");
    }
    await page.waitForTimeout(1500);
    await page.screenshot({ path: "/tmp/google-oauth-after-type.png", fullPage: true });

    // Name field
    const nameInput = page
      .locator('input[aria-label*="Name" i], input[formcontrolname*="name" i], input[type="text"]')
      .first();
    await nameInput.waitFor({ state: "visible", timeout: 15_000 });
    await nameInput.fill(APP_NAME);

    // Redirect URIs section — add each URI
    for (let i = 0; i < REDIRECTS.length; i++) {
      const uri = REDIRECTS[i];
      if (i > 0) {
        const addBtn = page.getByRole("button", { name: /add uri/i }).first();
        if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await addBtn.click();
          await page.waitForTimeout(400);
        }
      }
      const uriInputs = page.locator(
        'input[aria-label*="URI" i], input[aria-label*="redirect" i], input[placeholder*="https://" i]',
      );
      const count = await uriInputs.count();
      if (count === 0) {
        // Sometimes inputs appear after expanding Authorized redirect URIs
        const expand = page.getByText(/authorized redirect uris/i).first();
        if (await expand.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expand.click();
          await page.waitForTimeout(400);
        }
      }
      const inputs = page.locator(
        'input[aria-label*="URI" i], input[aria-label*="redirect" i], input[placeholder*="https://" i]',
      );
      const n = await inputs.count();
      const target = inputs.nth(Math.max(0, n - 1));
      await target.fill(uri);
    }

    await page.screenshot({ path: "/tmp/google-oauth-before-create.png", fullPage: true });

    const createBtn = page.getByRole("button", { name: /^create$/i }).first();
    await createBtn.click({ timeout: 15_000 });
    await page.waitForTimeout(3500);
    await page.screenshot({ path: "/tmp/google-oauth-created.png", fullPage: true });

    let { clientId, clientSecret } = await extractCreds(page);

    if (clientId && !clientSecret) {
      const addSecret = page
        .getByRole("button", { name: /add secret|create secret|reset secret|download json/i })
        .first();
      if (await addSecret.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addSecret.click();
        await page.waitForTimeout(1500);
        ({ clientId, clientSecret } = await extractCreds(page));
      }
    }

    // Download JSON if present
    const downloadBtn = page.getByRole("button", { name: /download json/i }).first();
    if ((!clientSecret || !clientId) && (await downloadBtn.isVisible({ timeout: 2000 }).catch(() => false))) {
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 15_000 }),
        downloadBtn.click(),
      ]);
      const tmp = await download.path();
      if (tmp) {
        const json = JSON.parse(readFileSync(tmp, "utf8"));
        clientId = json.web?.client_id || json.client_id || clientId;
        clientSecret = json.web?.client_secret || json.client_secret || clientSecret;
      }
    }

    if (!clientId?.includes(".apps.googleusercontent.com")) {
      throw new Error(
        "Could not capture client ID. Check /tmp/google-oauth-created.png and create manually if needed.",
      );
    }
    if (!clientSecret?.startsWith("GOCSPX-")) {
      upsertEnv({ GOOGLE_CLIENT_ID: clientId });
      throw new Error(
        `Saved client ID (${mask(clientId)}) but secret was not shown. Open the client → Add secret, then set GOOGLE_CLIENT_SECRET in .env.`,
      );
    }

    upsertEnv({
      GOOGLE_CLIENT_ID: clientId,
      GOOGLE_CLIENT_SECRET: clientSecret,
    });
    console.log("Wrote credentials to .env");
    console.log("GOOGLE_CLIENT_ID:", mask(clientId));
    console.log("GOOGLE_CLIENT_SECRET:", mask(clientSecret));
  } finally {
    await context.close().catch(() => undefined);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
