import { randomBytes } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import { absoluteEmailUrl } from "@/lib/email/layout";
import type { EmailAttachment } from "@/lib/email";
import { getMarketingImage } from "@/lib/admin/email-marketing-images";

const HEADER_CID = "splitsms-header";

function mimeForExt(ext: string) {
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/jpeg";
}

function cidAttachment(filename: string, content: Buffer, contentType: string): {
  htmlSrc: string;
  attachment: EmailAttachment;
} {
  return {
    htmlSrc: `cid:${HEADER_CID}`,
    attachment: {
      filename,
      content,
      contentType,
      contentId: HEADER_CID,
      inline: true,
    },
  };
}

function parseDataUrl(raw: string): { content: Buffer; contentType: string } | null {
  const match = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) return null;
  return {
    contentType: match[1],
    content: Buffer.from(match[2].replace(/\s/g, ""), "base64"),
  };
}

function fromDataUrl(raw: string) {
  const parsed = parseDataUrl(raw);
  if (!parsed) return null;
  const ext = parsed.contentType.includes("png")
    ? "png"
    : parsed.contentType.includes("webp")
      ? "webp"
      : parsed.contentType.includes("gif")
        ? "gif"
        : "jpg";
  return cidAttachment(`header.${ext}`, parsed.content, parsed.contentType);
}

function uploadBasename(url: string): string | null {
  try {
    const pathname = url.startsWith("http") ? new URL(url).pathname : url;
    const match =
      pathname.match(/\/uploads\/email-marketing\/([^/?#]+)$/) ??
      pathname.match(/\/api\/email-marketing\/blob\/([^/?#]+)$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

async function fromPublicFile(relUrl: string) {
  const rel = relUrl.replace(/^\/+/, "");
  const filePath = path.join(process.cwd(), "public", rel);
  try {
    const content = await readFile(filePath);
    return cidAttachment(
      path.basename(filePath),
      content,
      mimeForExt(path.extname(filePath).toLowerCase()),
    );
  } catch {
    return null;
  }
}

/**
 * Inline the header image with a CID so Gmail still shows uploads that are
 * not publicly fetchable (local disk or Vercel ephemeral storage).
 */
export async function resolveEmailHeaderImage(url?: string | null): Promise<{
  htmlSrc?: string;
  attachment?: EmailAttachment;
}> {
  const raw = url?.trim();
  if (!raw) return {};
  if (raw.startsWith("cid:")) return { htmlSrc: raw };

  const data = fromDataUrl(raw);
  if (data) return data;

  const basename = uploadBasename(raw);
  if (basename) {
    const disk = await fromPublicFile(`/uploads/email-marketing/${basename}`);
    if (disk) return disk;
    const blob = await getMarketingImage("blob", basename);
    const fromBlob = blob ? fromDataUrl(blob) : null;
    if (fromBlob) return fromBlob;
  }

  if (/^https?:\/\//i.test(raw)) {
    return { htmlSrc: raw };
  }

  const disk = await fromPublicFile(raw);
  if (disk) return disk;
  return { htmlSrc: absoluteEmailUrl(raw) };
}

async function embedUploadedImage(
  basename: string,
): Promise<{ content: Buffer; contentType: string } | null> {
  const filePath = path.join(process.cwd(), "public", "uploads", "email-marketing", basename);
  try {
    const content = await readFile(filePath);
    return { content, contentType: mimeForExt(path.extname(basename).toLowerCase()) };
  } catch {
    // Not on disk (deleted, or ephemeral serverless storage) - try the DB backup below.
  }
  const blob = await getMarketingImage("blob", basename);
  return blob ? parseDataUrl(blob) : null;
}

/**
 * Rewrites every /uploads/email-marketing/<file> <img> src inside a compose body
 * to a unique cid: reference and returns the actual image bytes as attachments,
 * so the picture reaches every recipient's inbox instead of depending on the
 * upload still being reachable at a public URL by the time the email is opened.
 * External http(s) image URLs are left untouched.
 */
export async function resolveEmailBodyImages(html: string): Promise<{
  html: string;
  attachments: EmailAttachment[];
}> {
  const srcPattern = /<img\b[^>]*\bsrc="([^"]*)"[^>]*>/gi;
  const basenames = new Set<string>();
  for (const match of html.matchAll(srcPattern)) {
    const basename = uploadBasename(match[1]);
    if (basename) basenames.add(basename);
  }
  if (basenames.size === 0) return { html, attachments: [] };

  const attachments: EmailAttachment[] = [];
  const cidByBasename = new Map<string, string>();

  for (const basename of basenames) {
    const embedded = await embedUploadedImage(basename);
    if (!embedded) continue;
    const cid = `body-${randomBytes(6).toString("hex")}`;
    attachments.push({
      filename: basename,
      content: embedded.content,
      contentType: embedded.contentType,
      contentId: cid,
      inline: true,
    });
    cidByBasename.set(basename, cid);
  }
  if (cidByBasename.size === 0) return { html, attachments: [] };

  const rewritten = html.replace(srcPattern, (fullMatch, src) => {
    const basename = uploadBasename(src);
    const cid = basename ? cidByBasename.get(basename) : undefined;
    if (!cid) return fullMatch;
    return fullMatch.replace(`src="${src}"`, `src="cid:${cid}"`);
  });

  return { html: rewritten, attachments };
}
