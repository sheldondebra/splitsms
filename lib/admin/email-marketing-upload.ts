import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function saveEmailMarketingImageUpload(file: File) {
  if (!file || file.size <= 0) {
    throw new Error("No file uploaded");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image must be 2MB or smaller");
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

  const dir = path.join(process.cwd(), "public", "uploads", "email-marketing");
  await mkdir(dir, { recursive: true });

  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  const publicPath = `/uploads/email-marketing/${filename}`;
  try {
    const { setMarketingImage } = await import("@/lib/admin/email-marketing-images");
    await setMarketingImage("blob", filename, `data:${file.type};base64,${buffer.toString("base64")}`);
  } catch {
    // Send still works from disk in local/dev.
  }

  return publicPath;
}

/** Prefer an uploaded file; otherwise the pasted/picked imageUrl field. */
export async function imageUrlFromMarketingForm(formData: FormData) {
  const file = formData.get("imageFile");
  if (file instanceof File && file.size > 0) {
    return saveEmailMarketingImageUpload(file);
  }
  return String(formData.get("imageUrl") ?? "").trim();
}
