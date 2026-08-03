#!/usr/bin/env node
/**
 * Copy a Google Search Console HTML verification file into public/.
 *
 * Usage:
 *   node scripts/seo/install-verification-file.mjs ~/Downloads/googleXXXXXXXX.html
 *   npm run seo:install-verification -- ~/Downloads/googleXXXXXXXX.html
 */

import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { basename, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const publicDir = join(root, "public");
const VERIFY_NAME = /^google[a-z0-9]+\.html$/i;

const src = process.argv[2];
if (!src) {
  console.error(
    "Usage: node scripts/seo/install-verification-file.mjs /path/to/googleXXXX.html",
  );
  process.exit(1);
}

const name = basename(src);
if (!VERIFY_NAME.test(name)) {
  console.error(
    `Refusing “${name}”: expected a Google verification filename like googleXXXXXXXX.html`,
  );
  process.exit(1);
}

if (!existsSync(src)) {
  console.error(`File not found: ${src}`);
  process.exit(1);
}

mkdirSync(publicDir, { recursive: true });
const dest = join(publicDir, name);
copyFileSync(src, dest);
console.log(`Installed ${dest}`);
console.log("Deploy, then click Verify in Search Console.");
console.log(`Also set GOOGLE_SITE_VERIFICATION in production for the meta-tag method.`);
