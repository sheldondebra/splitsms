#!/usr/bin/env node
/**
 * Deploy SplitSMS staging to Cloud Run (source build).
 *
 * Usage:
 *   npm run deploy:staging
 *   node scripts/deploy-staging.mjs
 *
 * Reads DATABASE_URL, SESSION_SECRET, REDIS_URL (and optional extras) from
 * .env / .env.local. Does not print secret values.
 *
 * Optional env overrides:
 *   GCP_PROJECT, CLOUD_RUN_SERVICE, CLOUD_RUN_REGION, STAGING_URL
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, unlinkSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

const PROJECT = process.env.GCP_PROJECT || "splitsms";
const SERVICE = process.env.CLOUD_RUN_SERVICE || "splitsms-staging";
const REGION = process.env.CLOUD_RUN_REGION || "us-central1";
const CLOUD_SQL_CONNECTION =
  process.env.CLOUD_SQL_CONNECTION_NAME || "splitsms:us-central1:splitsms-db";

const REQUIRED_KEYS = ["DATABASE_URL", "SESSION_SECRET"];
const OPTIONAL_KEYS = [
  "REDIS_URL",
  "CRON_SECRET",
  "MAILJET_API_KEY",
  "MAILJET_API_SECRET",
  "MAILJET_SECRET_KEY",
  "MAILJET_FROM_EMAIL",
  "MAILJET_FROM_NAME",
  "EMAIL_PROVIDER",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "RESEND_FROM_NAME",
];

function fail(message) {
  console.error(`deploy:staging: ${message}`);
  process.exit(1);
}

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    stdio: opts.stdio ?? "inherit",
    encoding: "utf8",
    env: process.env,
  });
  if (result.error) fail(result.error.message);
  if (result.status !== 0) {
    fail(`${cmd} ${args.join(" ")} failed (exit ${result.status ?? "?"})`);
  }
  return result;
}

function runCapture(cmd, args) {
  const result = spawnSync(cmd, args, {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    env: process.env,
  });
  if (result.error) fail(result.error.message);
  if (result.status !== 0) {
    const err = (result.stderr || result.stdout || "").trim();
    fail(`${cmd} ${args.join(" ")} failed${err ? `: ${err}` : ""}`);
  }
  return (result.stdout || "").trim();
}

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eq = trimmed.indexOf("=");
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && !(key in out)) out[key] = value;
  }
  return out;
}

function yamlQuote(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** Prefer Cloud SQL Auth socket URL on Cloud Run when connection name is set. */
function cloudRunDatabaseUrl(databaseUrl) {
  if (!CLOUD_SQL_CONNECTION) return databaseUrl;
  try {
    const u = new URL(databaseUrl);
    // postgresql://user:pass@host:5432/db → socket form
    const user = decodeURIComponent(u.username);
    const pass = decodeURIComponent(u.password);
    const db = u.pathname.replace(/^\//, "") || "splitsms";
    const auth = `${encodeURIComponent(user)}:${encodeURIComponent(pass)}`;
    return `postgresql://${auth}@/${db}?host=/cloudsql/${CLOUD_SQL_CONNECTION}`;
  } catch {
    return databaseUrl;
  }
}

function isUsableRedisUrl(url) {
  if (!url?.trim()) return false;
  try {
    const host = new URL(url).hostname;
    return host !== "localhost" && host !== "127.0.0.1";
  } catch {
    return false;
  }
}

function loadEnv() {
  const merged = {
    ...parseEnvFile(join(root, ".env")),
    ...parseEnvFile(join(root, ".env.local")),
  };
  // Process env wins for overrides (useful in CI)
  for (const key of [...REQUIRED_KEYS, ...OPTIONAL_KEYS, "NEXT_PUBLIC_APP_URL"]) {
    if (process.env[key]?.trim()) merged[key] = process.env[key].trim();
  }
  return merged;
}

function resolveStagingUrl(env) {
  if (process.env.STAGING_URL?.trim()) return process.env.STAGING_URL.trim();
  if (env.NEXT_PUBLIC_APP_URL?.includes("run.app")) return env.NEXT_PUBLIC_APP_URL.trim();

  let projectNumber = "";
  try {
    projectNumber = runCapture("gcloud", [
      "projects",
      "describe",
      PROJECT,
      "--format=value(projectNumber)",
    ]);
  } catch {
    /* fall through */
  }

  if (projectNumber) {
    return `https://${SERVICE}-${projectNumber}.${REGION}.run.app`;
  }

  fail(
    "Could not resolve STAGING_URL. Set STAGING_URL or NEXT_PUBLIC_APP_URL to your Cloud Run URL.",
  );
}

function writeEnvVarsFile(payload) {
  const dir = mkdtempSync(join(tmpdir(), "splitsms-cloudrun-"));
  const path = join(dir, "env.yaml");
  const body =
    Object.entries(payload)
      .map(([k, v]) => `${k}: ${yamlQuote(v)}`)
      .join("\n") + "\n";
  writeFileSync(path, body, { mode: 0o600 });
  return path;
}

function main() {
  const which = spawnSync("gcloud", ["--version"], { encoding: "utf8" });
  if (which.error || which.status !== 0) {
    fail("gcloud CLI not found. Install and run gcloud auth login.");
  }

  const env = loadEnv();
  const missing = REQUIRED_KEYS.filter((k) => !env[k]?.trim());
  if (missing.length) {
    fail(`Missing required env in .env / .env.local: ${missing.join(", ")}`);
  }

  const stagingUrl = resolveStagingUrl(env);
  const runtimeEnv = {
    DATABASE_URL: cloudRunDatabaseUrl(env.DATABASE_URL),
    SESSION_SECRET: env.SESSION_SECRET,
    NEXT_PUBLIC_APP_URL: stagingUrl,
  };
  if (isUsableRedisUrl(env.REDIS_URL)) {
    runtimeEnv.REDIS_URL = env.REDIS_URL.trim();
  }
  for (const key of OPTIONAL_KEYS) {
    if (key === "REDIS_URL") continue;
    if (env[key]?.trim()) runtimeEnv[key] = env[key].trim();
  }

  const envFile = writeEnvVarsFile(runtimeEnv);
  console.log(`deploy:staging → project=${PROJECT} service=${SERVICE} region=${REGION}`);
  console.log(`deploy:staging → NEXT_PUBLIC_APP_URL=${stagingUrl}`);
  console.log(`deploy:staging → Cloud SQL=${CLOUD_SQL_CONNECTION}`);
  console.log(`deploy:staging → runtime env keys: ${Object.keys(runtimeEnv).join(", ")}`);

  try {
    run("gcloud", [
      "run",
      "deploy",
      SERVICE,
      `--project=${PROJECT}`,
      `--source=${root}`,
      `--region=${REGION}`,
      "--allow-unauthenticated",
      "--port=8080",
      "--memory=1Gi",
      "--cpu=1",
      "--min-instances=0",
      "--max-instances=3",
      "--timeout=300",
      `--add-cloudsql-instances=${CLOUD_SQL_CONNECTION}`,
      `--set-build-env-vars=NEXT_PUBLIC_APP_URL=${stagingUrl},DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build`,
      `--env-vars-file=${envFile}`,
      "--quiet",
    ]);
  } finally {
    try {
      unlinkSync(envFile);
    } catch {
      /* ignore */
    }
  }

  let url = stagingUrl;
  try {
    const described = runCapture("gcloud", [
      "run",
      "services",
      "describe",
      SERVICE,
      `--project=${PROJECT}`,
      `--region=${REGION}`,
      "--format=value(status.url)",
    ]);
    if (described) url = described;
  } catch {
    /* keep stagingUrl */
  }

  console.log(`deploy:staging → done`);
  console.log(`Service URL: ${url}`);
}

main();
