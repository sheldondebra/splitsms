import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function saveResellerLogoUpload(file: File, resellerId: string) {
  if (!file || file.size <= 0) {
    throw new Error("No file uploaded");
  }
  if (file.size > MAX_LOGO_BYTES) {
    throw new Error("Logo must be 2MB or smaller");
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Use PNG, JPG, WEBP, or GIF");
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
          ? "gif"
          : "jpg";

  const dir = path.join(process.cwd(), "public", "uploads", "reseller-logos");
  await mkdir(dir, { recursive: true });

  const filename = `${resellerId}-${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return `/uploads/reseller-logos/${filename}`;
}
