/**
 * Verify WordPress plugin release artifacts after sync:site-config.
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const config = JSON.parse(readFileSync(join(root, "config/site.json"), "utf8"));
const version = config.wordpressPlugin.version;
const publicDir = join(root, "public/wordpress-plugin");
const versionedZip = join(publicDir, `splitsms-${version}.zip`);
const latestZip = join(publicDir, "splitsms.zip");
const manifestPath = join(publicDir, "version.json");

const errors = [];

if (!existsSync(versionedZip)) {
  errors.push(`Missing ${versionedZip}`);
}
if (!existsSync(latestZip)) {
  errors.push(`Missing ${latestZip}`);
}
if (!existsSync(manifestPath)) {
  errors.push(`Missing ${manifestPath}`);
}

if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (manifest.version !== version) {
    errors.push(`version.json version ${manifest.version} !== config ${version}`);
  }
  if (!manifest.download_url?.includes(`splitsms-${version}.zip`)) {
    errors.push(`download_url does not point to splitsms-${version}.zip`);
  }
}

if (existsSync(versionedZip) && process.platform === "win32") {
  try {
    execSync(
      `powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; $z=[IO.Compression.ZipFile]::OpenRead('${versionedZip.replace(/'/g, "''")}'); $ok=($z.Entries | Where-Object { $_.FullName -replace '\\\\','/' -eq 'splitsms/splitsms.php' }).Count -gt 0; $z.Dispose(); if (-not $ok) { exit 1 }"`,
      { encoding: "utf8" },
    );
  } catch {
    errors.push(`${versionedZip} is missing splitsms/splitsms.php (WordPress folder layout)`);
  }
}

const stale = readdirSync(publicDir).filter(
  (f) => f.startsWith("splitsms-") && f.endsWith(".zip") && f !== `splitsms-${version}.zip`,
);
if (stale.length) {
  errors.push(`Stale version zips in public/wordpress-plugin: ${stale.join(", ")} (run sync:site-config to remove)`);
}

if (errors.length) {
  console.error("WordPress plugin release verification FAILED:");
  errors.forEach((e) => console.error(" -", e));
  process.exit(1);
}

const siteUrl = config.siteUrl.replace(/\/$/, "");
console.log("WordPress plugin release OK");
console.log("Version:", version);
console.log("Update API:", `${siteUrl}/api/plugin/update`);
console.log("Download:", `${siteUrl}/wordpress-plugin/splitsms-${version}.zip`);
console.log("Latest:", `${siteUrl}/wordpress-plugin/splitsms.zip`);
console.log("");
console.log("After git push + deploy, on LIVE WordPress:");
console.log("  Dashboard → Updates → Update SplitSMS");
console.log("  (or Plugins → SplitSMS → Check for updates)");
