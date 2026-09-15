import { createHmac, timingSafeEqual } from "crypto";
import { getSiteUrl } from "@/lib/site-config";

function secret() {
  return (
    process.env.SESSION_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    "splitsms-email-marketing"
  );
}

export function emailMarketingTrackingToken(deliveryId: string) {
  const id = deliveryId.trim();
  const sig = createHmac("sha256", secret())
    .update(`em:${id}`)
    .digest("hex")
    .slice(0, 24);
  return `${id}.${sig}`;
}

export function parseEmailMarketingTrackingToken(token: string): string | null {
  const raw = token.trim();
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const deliveryId = raw.slice(0, dot);
  const sig = raw.slice(dot + 1).toLowerCase();
  if (!deliveryId || sig.length !== 24) return null;
  const expected = emailMarketingTrackingToken(deliveryId).slice(deliveryId.length + 1);
  try {
    if (sig.length !== expected.length) return null;
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    return deliveryId;
  } catch {
    return null;
  }
}

export function emailMarketingOpenUrl(token: string) {
  return `${getSiteUrl()}/em/o/${token}`;
}

export function emailMarketingClickUrl(token: string, targetUrl: string) {
  return `${getSiteUrl()}/em/c/${token}?u=${encodeURIComponent(targetUrl)}`;
}

export function emailMarketingUnsubscribeUrl(token: string) {
  return `${getSiteUrl()}/em/u/${token}`;
}

const SKIP_HREF =
  /^(mailto:|tel:|#|cid:|data:)/i;

export function wrapTrackingLinks(html: string, token: string): string {
  return html.replace(/href=(["'])([^"']+)\1/gi, (match, quote: string, href: string) => {
    const url = href.trim();
    if (!url || SKIP_HREF.test(url)) return match;
    if (/\/em\/[ocu]\//i.test(url)) return match;
    if (!/^https?:\/\//i.test(url)) return match;
    return `href=${quote}${emailMarketingClickUrl(token, url)}${quote}`;
  });
}

export function applyEmailOpenPixel(html: string, token: string): string {
  const pixel = `<img src="${emailMarketingOpenUrl(token)}" width="1" height="1" alt="" style="display:none;border:0;width:1px;height:1px" />`;
  if (html.includes("</body>")) {
    return html.replace("</body>", `${pixel}</body>`);
  }
  return `${html}${pixel}`;
}

export function applyEmailMarketingTracking(html: string, token: string): string {
  return applyEmailOpenPixel(wrapTrackingLinks(html, token), token);
}

export function safeClickRedirect(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export const EMAIL_OPEN_PIXEL_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);
