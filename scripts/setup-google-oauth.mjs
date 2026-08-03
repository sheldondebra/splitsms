#!/usr/bin/env node
/**
 * Opens the Google Auth Platform Clients page for project `splitsms`
 * and reports whether GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are set locally.
 *
 * Classic "Sign in with Google" Web client IDs cannot be created via gcloud;
 * create them in the Console, then paste into `.env`.
 *
 * Usage: node scripts/setup-google-oauth.mjs
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONSOLE_URL =
  "https://console.cloud.google.com/auth/clients/create?project=splitsms";

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

const env = {
  ...parseEnvFile(join(root, ".env")),
  ...parseEnvFile(join(root, ".env.local")),
};

const hasId = Boolean(env.GOOGLE_CLIENT_ID?.trim());
const hasSecret = Boolean(env.GOOGLE_CLIENT_SECRET?.trim());

console.log("Google Sign-In setup (project: splitsms)");
console.log("");
console.log("1) Create a Web OAuth client here:");
console.log(`   ${CONSOLE_URL}`);
console.log("");
console.log("2) Authorized redirect URIs:");
console.log("   http://localhost:3000/api/auth/google/callback");
console.log("   https://splitsms.com/api/auth/google/callback");
console.log("   https://www.splitsms.com/api/auth/google/callback");
console.log("");
console.log("3) Add to .env:");
console.log("   GOOGLE_CLIENT_ID=....apps.googleusercontent.com");
console.log("   GOOGLE_CLIENT_SECRET=GOCSPX-...");
console.log("");
console.log(
  `Local env: GOOGLE_CLIENT_ID=${hasId ? "set" : "MISSING"}, GOOGLE_CLIENT_SECRET=${hasSecret ? "set" : "MISSING"}`,
);

if (process.platform === "darwin") {
  spawnSync("open", [CONSOLE_URL], { stdio: "ignore" });
  console.log("Opened Google Auth Platform in your browser.");
}
