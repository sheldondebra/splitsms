import { randomBytes } from "crypto";
import { setMarketingImage } from "@/lib/admin/email-marketing-images";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

/**
 * Stores the uploaded image as a base64 blob in Postgres and returns a public
 * URL served by /api/email-marketing/blob/[filename]. Vercel's function
 * filesystem is read-only (aside from /tmp, which isn't publicly servable
 * and doesn't persist across invocations), so the database is the only
 * durable place to keep these — not a fallback for local disk storage.
 */
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

  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await setMarketingImage("blob", filename, `data:${file.type};base64,${buffer.toString("base64")}`);

  return `/api/email-marketing/blob/${filename}`;
}

/** Prefer an uploaded file; otherwise the pasted/picked imageUrl field. */
export async function imageUrlFromMarketingForm(formData: FormData) {
  const file = formData.get("imageFile");
  if (file instanceof File && file.size > 0) {
    return saveEmailMarketingImageUpload(file);
  }
  return String(formData.get("imageUrl") ?? "").trim();
}
