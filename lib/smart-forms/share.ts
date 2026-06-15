import type { SmartFormAnalyticsEventType } from "@/lib/generated/prisma/client";

export function analyticsEventForSource(
  source: string | undefined,
  context: "page" | "embed",
): SmartFormAnalyticsEventType {
  const s = (source ?? "").toLowerCase();

  if (s === "qr") return "QR_SCAN";
  if (s === "iframe" || s === "script" || s === "wordpress" || s === "wordpress_shortcode") {
    return context === "embed" ? "EMBED_LOAD" : "OPEN";
  }
  if (s === "share" || s === "whatsapp" || s === "email" || s === "facebook" || s === "twitter") {
    return "SHARE";
  }
  if (s === "shortlink" || s === "copy") return "SHORTLINK_CLICK";
  return context === "embed" ? "EMBED_LOAD" : "VIEW";
}

export function buildPublicFormUrl(
  siteUrl: string,
  shortCode: string,
  params?: Record<string, string | undefined>,
) {
  const url = new URL(`${siteUrl.replace(/\/$/, "")}/f/${shortCode}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export function buildEmbedUrl(siteUrl: string, shortCode: string, source = "iframe") {
  return `${siteUrl.replace(/\/$/, "")}/embed/forms/${shortCode}?source=${encodeURIComponent(source)}`;
}

export function buildIframeSnippet(embedUrl: string, title = "SplitSMS Smart Form") {
  return `<iframe
  src="${embedUrl}"
  width="100%"
  height="720"
  frameborder="0"
  style="border:0; width:100%; max-width:100%; min-height:720px;"
  title="${title}"
></iframe>`;
}

export function buildScriptSnippet(siteUrl: string, shortCode: string) {
  const base = siteUrl.replace(/\/$/, "");
  return `<div data-splitsms-form="${shortCode}"></div>
<script src="${base}/embed.js" async></script>`;
}

export function buildWordPressIframeSnippet(embedUrl: string, title = "SplitSMS Smart Form") {
  return buildIframeSnippet(embedUrl.replace("source=iframe", "source=wordpress"), title);
}
