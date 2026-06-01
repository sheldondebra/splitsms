/**
 * Validate SplitSMS WordPress plugin source and release zip (layout, readme, config).
 * Run: node scripts/validate-wordpress-plugin.mjs [--wordpress-org]
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const wordpressOrg = process.argv.includes("--wordpress-org");
const config = JSON.parse(readFileSync(join(root, "config/site.json"), "utf8"));
const wp = config.wordpressPlugin;
const version = wp.version;
const pluginDir = join(root, "wordpress-plugin/splitsms");
const mainPhp = join(pluginDir, "splitsms.php");
const readmePath = join(pluginDir, "readme.txt");
const configPhp = join(pluginDir, "includes/splitsms-config.php");
const publicDir = join(root, "public/wordpress-plugin");
const versionedZip = join(
  publicDir,
  (wp.versionedDownloadPath || "/wordpress-plugin/SplitSMS-v{version}.zip")
    .replace("{version}", version)
    .split("/")
    .filter(Boolean)
    .pop() || `SplitSMS-v${version}.zip`,
);
const latestZip = join(publicDir, "splitsms.zip");
const manifestPath = join(publicDir, "version.json");

const errors = [];
const warnings = [];

function fail(msg) {
  errors.push(msg);
}

function warn(msg) {
  warnings.push(msg);
}

function read(path) {
  return readFileSync(path, "utf8");
}

// --- Source: main plugin header ---
if (!existsSync(mainPhp)) {
  fail("Missing splitsms.php");
} else {
  const main = read(mainPhp);
  const headerVer = main.match(/^\s*\*\s*Version:\s*([\d.]+)/m)?.[1];
  const constVer = main.match(/define\('SPLITSMS_VERSION',\s*'([^']+)'\)/)?.[1];
  if (headerVer !== version) {
    fail(`splitsms.php header Version ${headerVer} !== config ${version}`);
  }
  if (constVer !== version) {
    fail(`SPLITSMS_VERSION ${constVer} !== config ${version}`);
  }
  if (!/License URI:/i.test(main)) {
    fail("splitsms.php missing License URI header");
  }
  if (!/Text Domain:\s*splitsms/i.test(main)) {
    fail("splitsms.php missing Text Domain");
  }
}

// --- readme.txt (WordPress.org) ---
if (!existsSync(readmePath)) {
  fail("Missing readme.txt");
} else {
  const readme = read(readmePath);
  const stable = readme.match(/^Stable tag:\s*([\d.]+)/m)?.[1];
  if (stable !== version) {
    fail(`readme.txt Stable tag ${stable} !== config ${version}`);
  }
  if (!/^License URI:/m.test(readme)) {
    fail("readme.txt missing License URI");
  }
  if (!/^Tested up to:/m.test(readme)) {
    fail("readme.txt missing Tested up to");
  }
  if (!/^Requires at least:/m.test(readme)) {
    fail("readme.txt missing Requires at least");
  }
  if (!/== External services ==/m.test(readme)) {
    warn("readme.txt missing External services section (recommended for directory)");
  }
  if (!/== Installation ==/m.test(readme)) {
    fail("readme.txt missing Installation section");
  }
  const desc = readme.match(/== Description ==\s*([\s\S]*?)==/);
  if (desc && desc[1].length > 12000) {
    warn("readme.txt Description may be too long for directory preview");
  }
}

// --- license.txt ---
if (!existsSync(join(pluginDir, "license.txt"))) {
  fail("Missing license.txt in plugin root");
}

// --- Generated config ---
if (!existsSync(configPhp)) {
  fail("Missing includes/splitsms-config.php — run npm run sync:site-config");
} else {
  const cfg = read(configPhp);
  const allowCloud = /define\('SPLITSMS_ALLOW_CLOUD_PACKAGES',\s*(true|false)\)/.exec(cfg)?.[1];
  const expectCloud = wordpressOrg ? "false" : "true";
  if (allowCloud !== expectCloud) {
    fail(
      `splitsms-config.php SPLITSMS_ALLOW_CLOUD_PACKAGES=${allowCloud} expected ${expectCloud} (run sync${wordpressOrg ? " --wordpress-org" : ""})`,
    );
  }
  if (!/function splitsms_allow_cloud_packages/.test(cfg)) {
    fail("splitsms-config.php missing splitsms_allow_cloud_packages()");
  }
  if (/define\('SPLITSMS_ENABLE_CUSTOM_UPDATER',\s*true\)/.test(cfg) && wordpressOrg) {
    fail("WordPress.org build must not enable SPLITSMS_ENABLE_CUSTOM_UPDATER");
  }
}

// Forbidden in source tree (should not ship)
const forbiddenInPlugin = [
  "includes/class-splitsms-updater.php",
  "node_modules",
];
for (const rel of forbiddenInPlugin) {
  if (existsSync(join(pluginDir, rel))) {
    if (rel.endsWith("updater.php")) {
      warn(`${rel} exists in source (excluded from zip — OK for dev)`);
    } else {
      fail(`Dev artifact present: ${rel}`);
    }
  }
}

// --- Release artifacts ---
if (!existsSync(versionedZip)) {
  fail(`Missing release zip: ${versionedZip} — run npm run sync:site-config`);
}
if (!existsSync(latestZip)) {
  fail(`Missing ${latestZip}`);
}
if (!existsSync(manifestPath)) {
  fail(`Missing ${manifestPath}`);
}

if (existsSync(manifestPath)) {
  const manifest = JSON.parse(read(manifestPath));
  if (manifest.version !== version) {
    fail(`version.json version ${manifest.version} !== ${version}`);
  }
  if (!manifest.download_url?.includes(version)) {
    warn("version.json download_url may not include current version string");
  }
}

function listZipEntries(zipPath) {
  if (process.platform === "win32") {
    const out = execSync(
      `powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; $z=[IO.Compression.ZipFile]::OpenRead('${zipPath.replace(/'/g, "''")}'); $z.Entries | ForEach-Object { ($_.FullName -replace '\\\\','/').TrimEnd('/') }; $z.Dispose()"`,
      { encoding: "utf8" },
    );
    return out
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
  }
  const listing = execSync(`unzip -l "${zipPath}"`, { encoding: "utf8" });
  const names = [];
  for (const line of listing.split(/\r?\n/)) {
    const m = line.match(/^\s*\d+\s+\d+\s+[\d-]+\s+[\d:]+\s+(.+)$/);
    if (m) names.push(m[1].replace(/\\/g, "/"));
  }
  return names;
}

const REQUIRED_IN_ZIP = [
  "splitsms/splitsms.php",
  "splitsms/license.txt",
  "splitsms/includes/splitsms-config.php",
  "splitsms/includes/class-splitsms-bootstrap.php",
  "splitsms/VERSION",
];

const FORBIDDEN_IN_ZIP = [
  /^splitsms\.php$/,
  /\/node_modules\//,
  /\/class-splitsms-updater\.php$/,
  /\/package\.json$/,
  /\/webpack\.config\.js$/,
  /\/\.git\//,
];

if (existsSync(versionedZip)) {
  let entries;
  try {
    entries = listZipEntries(versionedZip);
  } catch (e) {
    fail(`Could not read zip: ${e.message}`);
    entries = [];
  }

  for (const required of REQUIRED_IN_ZIP) {
    if (!entries.includes(required)) {
      fail(`Zip missing ${required}`);
    }
  }

  if (entries.filter((e) => e === "splitsms.php" || e.endsWith("/splitsms.php") && !e.startsWith("splitsms/")).length) {
    fail("Zip has flat splitsms.php at root — must be splitsms/splitsms.php only");
  }

  for (const entry of entries) {
    for (const pattern of FORBIDDEN_IN_ZIP) {
      if (pattern.test(entry)) {
        fail(`Zip contains forbidden path: ${entry}`);
      }
    }
  }

  const versionFile = entries.find((e) => e === "splitsms/VERSION");
  if (versionFile) {
    // VERSION checked by presence
  }
}

// Stale zips
if (existsSync(publicDir)) {
  const stale = readdirSync(publicDir).filter(
    (f) =>
      f.endsWith(".zip") &&
      (f.startsWith("SplitSMS-v") || f.startsWith("splitsms-plugin-v")) &&
      f !== `SplitSMS-v${version}.zip` &&
      f !== `splitsms-plugin-v${version}.zip`,
  );
  if (stale.length) {
    warn(`Stale version zips (run sync:site-config): ${stale.join(", ")}`);
  }
}

if (warnings.length) {
  console.warn("Warnings:");
  warnings.forEach((w) => console.warn(" -", w));
}

if (errors.length) {
  console.error("WordPress plugin validation FAILED:");
  errors.forEach((e) => console.error(" -", e));
  process.exit(1);
}

console.log("WordPress plugin validation OK");
console.log("Version:", version);
console.log("Profile:", wordpressOrg ? "wordpress.org" : "splitsms.com download");
if (existsSync(versionedZip)) {
  console.log("Zip:", versionedZip);
}
