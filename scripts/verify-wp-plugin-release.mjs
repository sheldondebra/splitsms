/**
 * Verify WordPress plugin release artifacts after sync:site-config.
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const config = JSON.parse(readFileSync(join(root, "config/site.json"), "utf8"));
const wp = config.wordpressPlugin;
const version = wp.version;
const siteUrl = config.siteUrl.replace(/\/$/, "");
const versionedFilename =
  (wp.versionedDownloadPath || "/wordpress-plugin/SplitSMS-v{version}.zip")
    .replace("{version}", version)
    .split("/")
    .filter(Boolean)
    .pop() || `SplitSMS-v${version}.zip`;

const validate = spawnSync(
  process.execPath,
  [join(__dirname, "validate-wordpress-plugin.mjs")],
  { cwd: root, stdio: "inherit" },
);

if (validate.status !== 0) {
  process.exit(validate.status ?? 1);
}

console.log("");
console.log("WordPress plugin release OK");
console.log("Version:", version);
console.log("Update API:", `${siteUrl}${wp.updateCheckPath}`);
console.log("Download:", `${siteUrl}/wordpress-plugin/${versionedFilename}`);
console.log("Latest:", `${siteUrl}${wp.downloadPath}`);
console.log("");
console.log("Install test (manual):");
console.log("  1. Plugins → Add New → Upload Plugin → choose public/wordpress-plugin/" + versionedFilename);
console.log("  2. Activate — no critical error");
console.log("  3. SplitSMS → Settings → Test connection");
console.log("");
console.log("WordPress.org SVN: npm run release:wp-plugin-org");
