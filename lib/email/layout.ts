import { getSiteUrl, siteName, supportEmail } from "@/lib/site-config";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Shared responsive email shell for marketing / outreach messages. */
export function marketingEmailLayout(params: {
  preheader?: string;
  headline?: string;
  greeting?: string;
  bodyHtml: string;
  ctaHref?: string;
  ctaLabel?: string;
  footerNote?: string;
}) {
  const siteUrl = getSiteUrl();
  const preheader = params.preheader ?? params.headline ?? siteName;
  const headline = params.headline ?? `Message from ${siteName}`;
  const greeting = params.greeting
    ? `<p style="margin:0 0 16px;font-size:15px;color:#171717;">${escapeHtml(params.greeting)}</p>`
    : "";
  const cta =
    params.ctaHref && params.ctaLabel
      ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 8px;">
  <tr>
    <td style="border-radius:10px;background:#ea580c;">
      <a href="${escapeHtml(params.ctaHref)}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">${escapeHtml(params.ctaLabel)}</a>
    </td>
  </tr>
</table>`
      : "";
  const footerNote = params.footerNote
    ? `<p style="margin:0 0 8px;font-size:12px;color:#737373;line-height:1.5;">${escapeHtml(params.footerNote)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(headline)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e5e5;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#ea580c 0%,#c2410c 100%);padding:24px 28px;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.85);">${escapeHtml(siteName)}</p>
              <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;font-weight:700;color:#ffffff;">${escapeHtml(headline)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              ${greeting}
              ${params.bodyHtml}
              ${cta}
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;">
              ${footerNote}
              <p style="margin:16px 0 0;font-size:12px;color:#a3a3a3;line-height:1.5;">
                Sent by <a href="${escapeHtml(siteUrl)}" style="color:#ea580c;text-decoration:none;">${escapeHtml(siteName)}</a>
                ${supportEmail ? ` · <a href="mailto:${escapeHtml(supportEmail)}" style="color:#ea580c;text-decoration:none;">Support</a>` : ""}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function textToEmailParagraphs(text: string) {
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return `<p style="margin:0 0 14px;">&nbsp;</p>`;
      return `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#525252;">${escapeHtml(trimmed)}</p>`;
    })
    .join("");
}

export function stripSignatureFooter(text: string) {
  return text.replace(/\n—\s*[\s\S]*$/, "").trimEnd();
}
