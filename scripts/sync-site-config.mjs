/**
 * Sync config/site.json → WordPress plugin PHP, public manifests, Postman.
 * Run: node scripts/sync-site-config.mjs
 * Also runs before build via package.json.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync, unlinkSync, rmSync, cpSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import JSZip from "jszip";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const wordpressOrg = process.argv.includes("--wordpress-org");
const config = JSON.parse(readFileSync(join(root, "config/site.json"), "utf8"));
const siteUrl = config.siteUrl.replace(/\/$/, "");
const wp = config.wordpressPlugin;
const allowCloudPackages = wordpressOrg ? false : wp.allowCloudPackages !== false;
const enableCustomUpdater = wordpressOrg ? false : wp.enableCustomUpdater === true;
const testedWp = wp.tested || "6.8";

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
define('SPLITSMS_SIGNUP_URL', '${siteUrl}/signup');
define('SPLITSMS_LOGIN_URL', '${siteUrl}/login');
define('SPLITSMS_API_DOCS_URL', '${siteUrl}/api-docs');
define('SPLITSMS_INTEGRATIONS_URL', '${siteUrl}/integrations');
define('SPLITSMS_PLUGIN_DOWNLOAD_URL', '${versionedDownloadUrl}');
define('SPLITSMS_PLUGIN_DOWNLOAD_LATEST_URL', '${latestDownloadUrl}');
define('SPLITSMS_UPDATE_CHECK_URL', '${siteUrl}${wp.updateCheckPath}');
define('SPLITSMS_PLUGIN_VERSION', '${wp.version}');
define('SPLITSMS_ALLOW_CLOUD_PACKAGES', ${allowCloudPackages ? "true" : "false"});
define('SPLITSMS_ENABLE_CUSTOM_UPDATER', ${enableCustomUpdater ? "true" : "false"});

if (!function_exists('splitsms_allow_cloud_packages')) {
    function splitsms_allow_cloud_packages() {
        return defined('SPLITSMS_ALLOW_CLOUD_PACKAGES') && SPLITSMS_ALLOW_CLOUD_PACKAGES;
    }
}

if (!function_exists('splitsms_enable_custom_updater')) {
    function splitsms_enable_custom_updater() {
        return defined('SPLITSMS_ENABLE_CUSTOM_UPDATER') && SPLITSMS_ENABLE_CUSTOM_UPDATER;
    }
}
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
  readme = readme.replace(/Tested up to: [\d.]+/, `Tested up to: ${testedWp}`);
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
  tested: testedWp,
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
  writeFileSync(
    join(stagingDir, "VERSION"),
    `${wp.version}\n`,
    "utf8",
  );
}

const REQUIRED_ZIP_FILES = [
  "splitsms/splitsms.php",
  "splitsms/license.txt",
  "splitsms/includes/splitsms-config.php",
  "splitsms/includes/class-splitsms-install.php",
  "splitsms/includes/class-splitsms-bootstrap.php",
  "splitsms/includes/class-splitsms-plugin-status.php",
  "splitsms/includes/integrations/class-splitsms-form-sms-helper.php",
  "splitsms/includes/integrations/class-splitsms-elementor-send-sms-action.php",
  "splitsms/includes/integrations/class-splitsms-jfb-send-sms-action.php",
  "splitsms/admin/views/help-documentation.php",
  "splitsms/VERSION",
];

/**
 * Add every file under dirPath into the zip, always using forward-slash
 * entry paths regardless of OS — avoids the backslash-corrupted entries
 * that Windows's PowerShell Compress-Archive used to produce.
 */
function addDirToZip(zip, dirPath, zipPath) {
  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
    if (entry.name === ".DS_Store") continue;
    const diskPath = join(dirPath, entry.name);
    const entryZipPath = `${zipPath}/${entry.name}`;
    if (entry.isDirectory()) {
      addDirToZip(zip, diskPath, entryZipPath);
    } else {
      zip.file(entryZipPath, readFileSync(diskPath));
    }
  }
}

async function buildZip(outPath) {
  prepareStagingDir();
  const zip = new JSZip();
  addDirToZip(zip, stagingDir, "splitsms");
  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  writeFileSync(outPath, buffer);
  rmSync(join(root, ".tmp-plugin-zip"), { recursive: true, force: true });
}

async function validateZip(zipOut) {
  const expect = "splitsms/splitsms.php";
  const zip = await JSZip.loadAsync(readFileSync(zipOut));
  const names = Object.keys(zip.files).filter((name) => !zip.files[name].dir);

  for (const name of names) {
    if (name.includes("\\")) {
      throw new Error(`Zip entry has a literal backslash in its path: ${name}`);
    }
  }

  for (const required of REQUIRED_ZIP_FILES) {
    if (!names.includes(required)) {
      throw new Error(`Zip missing ${required}`);
    }
  }
  if (!names.includes(expect)) {
    throw new Error(`Zip missing ${expect}`);
  }
  if (names.includes("splitsms.php")) {
    throw new Error("Zip has flat splitsms.php at archive root — must be splitsms/splitsms.php");
  }
}

try {
  await buildZip(versionedZip);
  await validateZip(versionedZip);
  copyFileSync(versionedZip, latestZip);

  const legacyVersioned = join(publicWpDir, `splitsms-plugin-v${wp.version}.zip`);
  const legacyVersionedFilename = `splitsms-plugin-v${wp.version}.zip`;
  copyFileSync(versionedZip, legacyVersioned);

  const keepZips = new Set([versionedZipFilename, legacyVersionedFilename, "splitsms.zip"]);

  for (const file of readdirSync(publicWpDir)) {
    if (!file.endsWith(".zip") || keepZips.has(file)) {
      continue;
    }
    if (
      /^splitsms/i.test(file) ||
      /^SplitSMS-v/i.test(file)
    ) {
      unlinkSync(join(publicWpDir, file));
      console.log("Removed stale zip:", file);
    }
  }

  console.log("Wrote", versionedZip);
  console.log("Wrote", legacyVersioned);
  console.log("Wrote", latestZip, "(latest alias)");
} catch (e) {
  console.warn("Zip skipped:", e.message);
}

console.log("Synced site config → WordPress plugin, public/wordpress-plugin/, Postman");
console.log("Site URL:", siteUrl);
console.log("Plugin version:", wp.version);
console.log("Build:", wordpressOrg ? "wordpress.org (no cloud packages)" : "splitsms.com download");
console.log("SPLITSMS_ALLOW_CLOUD_PACKAGES:", allowCloudPackages);
console.log("Versioned download:", versionedDownloadUrl);
