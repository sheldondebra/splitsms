import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "public/icon.png");
const ORANGE = { r: 250, g: 123, b: 0, alpha: 1 };

function icoFromPngs(pngs) {
  const count = pngs.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const entries = [];
  const payloads = [];
  let offset = 6 + 16 * count;
  for (const png of pngs) {
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    const entry = Buffer.alloc(16);
    entry[0] = width >= 256 ? 0 : width;
    entry[1] = height >= 256 ? 0 : height;
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    payloads.push(png);
    offset += png.length;
  }
  return Buffer.concat([header, ...entries, ...payloads]);
}

const square = await sharp(source)
  .resize(512, 512, { fit: "cover", position: "centre", background: ORANGE })
  .flatten({ background: ORANGE })
  .png({ compressionLevel: 9 })
  .toBuffer();

const apple = await sharp(square).resize(180, 180).png({ compressionLevel: 9 }).toBuffer();
const png32 = await sharp(square).resize(32, 32).ensureAlpha().png({ compressionLevel: 9 }).toBuffer();
const png16 = await sharp(square).resize(16, 16).ensureAlpha().png({ compressionLevel: 9 }).toBuffer();
const png48 = await sharp(square).resize(48, 48).ensureAlpha().png({ compressionLevel: 9 }).toBuffer();
const ico = icoFromPngs([png16, png32, png48]);

const pngTargets = [
  join(root, "public/icon.png"),
  join(root, "public/logo.png"),
  join(root, "app/icon.png"),
];
for (const target of pngTargets) writeFileSync(target, square);

for (const target of [join(root, "public/apple-icon.png"), join(root, "public/apple-touch-icon.png"), join(root, "app/apple-icon.png")]) {
  writeFileSync(target, apple);
}

writeFileSync(join(root, "public/favicon.ico"), ico);
writeFileSync(join(root, "app/favicon.ico"), ico);

copyFileSync(join(root, "public/bimi.svg"), join(root, "public/icon.svg"));

console.log("Wrote square 512 brand icons, 180 apple icons, and favicon.ico");
