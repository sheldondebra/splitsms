/**
 * Sync config/site.json → WordPress plugin PHP, public manifests, Postman.
 * Run: node scripts/sync-site-config.mjs
 * Also runs before build via package.json.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const config = JSON.parse(readFileSync(join(root, "config/site.json"), "utf8"));
const siteUrl = config.siteUrl.replace(/\/$/, "");
const wp = config.wordpressPlugin;

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
define('SPLITSMS_PLUGIN_DOWNLOAD_URL', '${siteUrl}${wp.downloadPath}');
define('SPLITSMS_UPDATE_CHECK_URL', '${siteUrl}${wp.updateCheckPath}');
define('SPLITSMS_PLUGIN_VERSION', '${wp.version}');
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
  download_url: `${siteUrl}${wp.downloadPath}`,
  requires: "6.0",
  tested: "6.7",
  requires_php: "7.4",
  api_base_url: siteUrl,
  api_docs_url: `${siteUrl}/api-docs`,
  integrations_url: `${siteUrl}/integrations`,
  update_check_url: `${siteUrl}${wp.updateCheckPath}`,
  last_updated: new Date().toISOString().slice(0, 10),
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

// Zip plugin for download
const pluginDir = join(root, "wordpress-plugin/splitsms");
const zipOut = join(publicWpDir, "splitsms.zip");
try {
  if (process.platform === "win32") {
    execSync(
      `powershell -NoProfile -Command "Compress-Archive -Path '${pluginDir.replace(/'/g, "''")}\\*' -DestinationPath '${zipOut.replace(/'/g, "''")}' -Force"`,
      { stdio: "inherit", cwd: root },
    );
  } else {
    execSync(`cd "${join(root, "wordpress-plugin")}" && zip -r "${zipOut}" splitsms -x "*.DS_Store"`, {
      stdio: "inherit",
    });
  }
  console.log("Wrote", zipOut);
} catch (e) {
  console.warn("Zip skipped (install zip or run on Windows with Compress-Archive):", e.message);
}

console.log("Synced site config → WordPress plugin, public/wordpress-plugin/, Postman");
console.log("Site URL:", siteUrl);
