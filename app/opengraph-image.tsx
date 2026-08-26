import { createOgImageResponse, defaultOgCopy, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/seo/og-image";

export const alt = defaultOgCopy.alt;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const runtime = "nodejs";

export default async function OpenGraphImage() {
  return createOgImageResponse();
}
