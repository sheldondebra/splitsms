/**
 * Copy wordpress-plugin/splitsms → Local by Flywheel (or SPLITSMS_WP_LOCAL_PATH).
 * Run: npm run sync:wp-local
 * Watch: npm run sync:wp-local -- --watch
 */
import { cpSync, existsSync, mkdirSync, readdirSync, watch } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const source = join(root, "wordpress-plugin/splitsms");

const defaultTarget =
  "C:\\Users\\Moon\\Local Sites\\splitsms\\app\\public\\wp-content\\plugins\\splitsms-1.4.1";

const target = (process.env.SPLITSMS_WP_LOCAL_PATH || defaultTarget).replace(/\/$/, "");

if (!existsSync(source)) {
  console.error("Source plugin not found:", source);
  process.exit(1);
}

if (!existsSync(target)) {
  mkdirSync(target, { recursive: true });
}

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const from = join(src, entry.name);
    const to = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else {
      cpSync(from, to, { force: true });
    }
  }
}

function sync() {
  copyDir(source, target);
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] Synced → ${target}`);
}

sync();

if (process.argv.includes("--watch")) {
  console.log("Watching", source, "for changes (Ctrl+C to stop)…");
  let timer = null;
  watch(source, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(sync, 200);
  });
}
