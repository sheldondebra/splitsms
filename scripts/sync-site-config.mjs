/**
 * Sync config/site.json → WordPress plugin PHP, public manifests, Postman.
 * Run: node scripts/sync-site-config.mjs
 * Also runs before build via package.json.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync, unlinkSync, rmSync, cpSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const config = JSON.parse(readFileSync(join(root, "config/site.json"), "utf8"));
const siteUrl = config.siteUrl.replace(/\/$/, "");
const wp = config.wordpressPlugin;

const versionedPath =
  (wp.versionedDownloadPath || "/wordpress-plugin/splitsms-{version}.zip").replace(
    "{version}",
    wp.version,
  );
const versionedDownloadUrl = `${siteUrl}${versionedPath}`;
const latestDownloadUrl = `${siteUrl}${wp.downloadPath}`;
const versionedZipFilename = versionedPath.split("/").filter(Boolean).pop() || `SplitSMS-v${wp.version}.zip`;

function extractChangelog(readmePath, targetVersion) {
  if (!existsSync(readmePath)) {
    return "";
  }
  const readme = readFileSync(readmePath, "utf8");
  const marker = `= ${targetVersion} =`;
  const start = readme.indexOf(marker);
  if (start === -1) {
    return "";
  }
  const after = readme.slice(start + marker.length);
  const next = after.search(/\r?\n= \d+\.\d+/);
  const block = (next === -1 ? after : after.slice(0, next)).trim();
  return block
    .split(/\r?\n/)
    .map((line) => line.replace(/^\*\s*/, "• "))
    .join("\n");
}

const readmePath = join(root, "wordpress-plugin/splitsms/readme.txt");
const changelogText = extractChangelog(readmePath, wp.version);

// WordPress PHP config (single source for plugin defaults)
const phpConfig = `<?php
/**
 * Auto-generated from config/site.json — run: npm run sync:site-config
 * Do not edit manually; change config/site.json and re-sync.
 */
if (!defined('ABSPATH')) {
    exit;
}

define('SPLITSMS_APP_URL', '${siteUrl}');
define('SPLITSMS_API_DOCS_URL', '${siteUrl}/api-docs');
define('SPLITSMS_INTEGRATIONS_URL', '${siteUrl}/integrations');
define('SPLITSMS_PLUGIN_DOWNLOAD_URL', '${versionedDownloadUrl}');
define('SPLITSMS_PLUGIN_DOWNLOAD_LATEST_URL', '${latestDownloadUrl}');
define('SPLITSMS_UPDATE_CHECK_URL', '${siteUrl}${wp.updateCheckPath}');
define('SPLITSMS_PLUGIN_VERSION', '${wp.version}');
define('SPLITSMS_ENABLE_CUSTOM_UPDATER', false);
`;

writeFileSync(join(root, "wordpress-plugin/splitsms/includes/splitsms-config.php"), phpConfig);

// Sync version in main plugin file header + constant
const mainPlugin = join(root, "wordpress-plugin/splitsms/splitsms.php");
let mainPhp = readFileSync(mainPlugin, "utf8");
mainPhp = mainPhp.replace(/Version:\s*[\d.]+/, `Version:           ${wp.version}`);
mainPhp = mainPhp.replace(/define\('SPLITSMS_VERSION', '[^']+'\)/, `define('SPLITSMS_VERSION', '${wp.version}')`);
writeFileSync(mainPlugin, mainPhp);

const readmeTxt = join(root, "wordpress-plugin/splitsms/readme.txt");
if (existsSync(readmeTxt)) {
  let readme = readFileSync(readmeTxt, "utf8");
  readme = readme.replace(/Stable tag: [\d.]+/, `Stable tag: ${wp.version}`);
  writeFileSync(readmeTxt, readme);
}

// Public version manifest (WordPress update checker + CDN)
const publicWpDir = join(root, "public/wordpress-plugin");
mkdirSync(publicWpDir, { recursive: true });

const versionManifest = {
  name: "SplitSMS",
  slug: wp.slug,
  version: wp.version,
  homepage: siteUrl,
  download_url: versionedDownloadUrl,
  download_url_latest: latestDownloadUrl,
  download_filename: versionedZipFilename,
  requires: "6.0",
  tested: "6.7",
  requires_php: "7.4",
  api_base_url: siteUrl,
  api_docs_url: `${siteUrl}/api-docs`,
  integrations_url: `${siteUrl}/integrations`,
  update_check_url: `${siteUrl}${wp.updateCheckPath}`,
  last_updated: new Date().toISOString().slice(0, 10),
  changelog: changelogText,
};

writeFileSync(join(publicWpDir, "version.json"), JSON.stringify(versionManifest, null, 2) + "\n");

// Postman collection baseUrl
const postmanPath = join(root, "public/postman/splitsms.collection.json");
if (existsSync(postmanPath)) {
  const collection = JSON.parse(readFileSync(postmanPath, "utf8"));
  const baseVar = collection.variable?.find((v) => v.key === "baseUrl");
  if (baseVar) baseVar.value = siteUrl;
  writeFileSync(postmanPath, JSON.stringify(collection, null, 2) + "\n");
}

// Zip plugin — WordPress expects splitsms/splitsms.php inside the archive (single top-level folder).
const pluginDir = join(root, "wordpress-plugin/splitsms");
const versionedZip = join(publicWpDir, versionedZipFilename);
const latestZip = join(publicWpDir, "splitsms.zip");
const SKIP_DIRS = new Set(["node_modules", ".git", "src", ".github", ".vscode", "tests", "test"]);
const SKIP_FILES = new Set([
  ".gitignore",
  ".babelrc",
  "package.json",
  "package-lock.json",
  "webpack.config.js",
  "composer.json",
  "composer.lock",
  "phpunit.xml",
  "phpcs.xml",
  "phpcs.xml.dist",
  "class-splitsms-updater.php",
]);
const stagingDir = join(root, ".tmp-plugin-zip/splitsms");

function copyPluginFiltered(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const from = join(src, entry.name);
    const to = join(dest, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      copyPluginFiltered(from, to);
    } else {
      if (SKIP_FILES.has(entry.name)) continue;
      cpSync(from, to);
    }
  }
}

function prepareStagingDir() {
  rmSync(join(root, ".tmp-plugin-zip"), { recursive: true, force: true });
  copyPluginFiltered(pluginDir, stagingDir);
}

function buildZip(outPath) {
  prepareStagingDir();
  const zipSource = join(root, ".tmp-plugin-zip");
  if (process.platform === "win32") {
    const psZip = [
      `$src = '${zipSource.replace(/'/g, "''")}'`,
      `$out = '${outPath.replace(/'/g, "''")}'`,
      "if (Test-Path $out) { Remove-Item $out -Force }",
      "Compress-Archive -Path (Join-Path $src 'splitsms') -DestinationPath $out -Force",
    ].join("; ");
    execSync(`powershell -NoProfile -Command "${psZip}"`, { stdio: "inherit", cwd: root });
  } else {
    execSync(`cd "${zipSource}" && zip -r "${outPath}" splitsms -x "*.DS_Store"`, { stdio: "inherit" });
  }
  rmSync(join(root, ".tmp-plugin-zip"), { recursive: true, force: true });
}

function validateZip(zipOut) {
  const expect = "splitsms/splitsms.php";
  if (process.platform === "win32") {
    execSync(
      `powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; $z=[IO.Compression.ZipFile]::OpenRead('${zipOut.replace(/'/g, "''")}'); $ok=($z.Entries | Where-Object { $_.FullName -replace '\\\\','/' -eq '${expect}' }).Count -gt 0; $bad=($z.Entries | Where-Object { $_.FullName -replace '\\\\','/' -eq 'splitsms.php' }).Count -gt 0; $z.Dispose(); if (-not $ok -or $bad) { exit 1 }"`,
      { encoding: "utf8" },
    );
  } else {
    const listing = execSync(`unzip -l "${zipOut}"`, { encoding: "utf8" });
    if (!listing.includes(` ${expect}`) && !listing.includes(`splitsms/splitsms.php`)) {
      throw new Error(`Zip missing ${expect}`);
    }
    if (listing.match(/^\s+\d+\s+\d{2}-\d{2}-\d{2,4}\s+\d{2}:\d{2}\s+splitsms\.php$/m)) {
      throw new Error("Zip has flat splitsms.php at archive root — must be splitsms/splitsms.php");
    }
  }
}

try {
  buildZip(versionedZip);
  validateZip(versionedZip);
  copyFileSync(versionedZip, latestZip);

  for (const file of readdirSync(publicWpDir)) {
    if (
      /^splitsms-.*\.zip$/i.test(file) &&
      file.endsWith(".zip") &&
      file !== versionedZipFilename
    ) {
      unlinkSync(join(publicWpDir, file));
      console.log("Removed stale zip:", file);
      continue;
    }
    if (
      /^splitsms-v.*\.zip$/i.test(file) &&
      file.endsWith(".zip") &&
      file !== versionedZipFilename
    ) {
      unlinkSync(join(publicWpDir, file));
      console.log("Removed stale zip:", file);
      continue;
    }
    if (
      /^splitsms-v?\d.*\.zip$/i.test(file) &&
      file.endsWith(".zip") &&
      file !== versionedZipFilename
    ) {
      unlinkSync(join(publicWpDir, file));
      console.log("Removed stale zip:", file);
      continue;
    }
    if (
      /^SplitSMS-v.*\.zip$/i.test(file) &&
      file.endsWith(".zip") &&
      file !== versionedZipFilename
    ) {
      unlinkSync(join(publicWpDir, file));
      console.log("Removed stale zip:", file);
    }
  }

  console.log("Wrote", versionedZip);
  console.log("Wrote", latestZip, "(latest alias)");
} catch (e) {
  console.warn("Zip skipped:", e.message);
}

console.log("Synced site config → WordPress plugin, public/wordpress-plugin/, Postman");
console.log("Site URL:", siteUrl);
console.log("Plugin version:", wp.version);
console.log("Versioned download:", versionedDownloadUrl);
