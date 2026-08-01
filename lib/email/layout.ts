import { getSiteUrl, siteName, supportEmail } from "@/lib/site-config";

/** Where a full-width header image sits relative to the headline. */
export type EmailHeaderImagePosition = "above" | "below";

/** Brand tokens for transactional email (inline CSS only). */
const emailTheme = {
  pageBg: "#f4f4f5",
  cardBg: "#ffffff",
  cardBorder: "#e4e4e7",
  ink: "#18181b",
  body: "#3f3f46",
  muted: "#71717a",
  faint: "#a1a1aa",
  rule: "#e4e4e7",
  accent: "#c2410c",
  accentSoft: "#fff7ed",
  codeBg: "#fafafa",
  buttonBg: "#c2410c",
  buttonText: "#ffffff",
  footerBg: "#c2410c",
  footerText: "#ffffff",
  footerMuted: "rgba(255,255,255,0.85)",
  font: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
  mono: "ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace",
} as const;

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type EmailLayoutParams = {
  preheader?: string;
  eyebrow?: string;
  headline: string;
  greeting?: string;
  bodyHtml: string;
  ctaHref?: string;
  ctaLabel?: string;
  footerNote?: string;
  /** Show brand logo in header (marketing emails). Default false for compact transactional mail. */
  showLogo?: boolean;
  contactLine?: string;
  /** Full-width header image. Overrides admin branding when set. */
  headerImageUrl?: string;
  /** Place header image above or below the headline. */
  headerImagePosition?: EmailHeaderImagePosition;
};

function headerImageBlock(url: string) {
  return `<tr>
  <td style="padding:0;line-height:0;font-size:0;">
    <img src="${escapeHtml(url)}" alt="" width="560" style="display:block;width:100%;max-width:560px;height:auto;border:0;" />
  </td>
</tr>`;
}

/** Shared clean layout for all SplitSMS transactional and outreach emails. */
export function emailLayout(params: EmailLayoutParams) {
  const siteUrl = getSiteUrl();
  const logoUrl = `${siteUrl}/smslogo.png`;
  const preheader = params.preheader ?? params.headline;
  const eyebrow = params.eyebrow ?? siteName;
  const greeting = params.greeting
    ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:${emailTheme.ink};">${escapeHtml(params.greeting)}</p>`
    : "";
  const cta =
    params.ctaHref && params.ctaLabel
      ? emailButton(params.ctaHref, params.ctaLabel)
      : "";
  const footerNote = params.footerNote
    ? `<p style="margin:0 0 12px;font-size:12px;line-height:1.55;color:${emailTheme.footerMuted};">${escapeHtml(params.footerNote)}</p>`
    : "";
  const contactLine = params.contactLine
    ? `<p style="margin:8px 0 0;font-size:12px;line-height:1.55;color:${emailTheme.footerMuted};">${escapeHtml(params.contactLine)}</p>`
    : "";
  const headerBrand = params.showLogo
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 14px;">
  <tr>
    <td>
      <a href="${escapeHtml(siteUrl)}" style="text-decoration:none;">
        <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(siteName)}" width="132" height="auto" style="display:block;max-width:132px;height:auto;border:0;" />
      </a>
    </td>
  </tr>
</table>
<p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${emailTheme.accent};">${escapeHtml(eyebrow)}</p>`
    : `<p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${emailTheme.accent};">${escapeHtml(eyebrow)}</p>`;

  const headerImageUrl = params.headerImageUrl?.trim() || "";
  const headerImagePosition = params.headerImagePosition === "below" ? "below" : "above";
  const imageAbove =
    headerImageUrl && headerImagePosition === "above"
      ? headerImageBlock(headerImageUrl)
      : "";
  const imageBelow =
    headerImageUrl && headerImagePosition === "below"
      ? headerImageBlock(headerImageUrl)
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(params.headline)}</title>
</head>
<body style="margin:0;padding:0;background:${emailTheme.pageBg};font-family:${emailTheme.font};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${emailTheme.pageBg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:${emailTheme.cardBg};border:1px solid ${emailTheme.cardBorder};border-radius:12px;overflow:hidden;">
          ${imageAbove}
          <tr>
            <td style="padding:28px 32px 12px;">
              ${headerBrand}
              <h1 style="margin:12px 0 0;font-size:24px;line-height:1.25;font-weight:700;color:${emailTheme.ink};letter-spacing:-0.02em;">${escapeHtml(params.headline)}</h1>
            </td>
          </tr>
          ${imageBelow}
          <tr>
            <td style="padding:16px 32px 8px;">
              ${greeting}
              ${params.bodyHtml}
              ${cta}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 28px;background:${emailTheme.footerBg};">
              ${footerNote}
              ${contactLine}
              <p style="margin:${footerNote || contactLine ? "12px" : "0"} 0 0;font-size:12px;line-height:1.55;color:${emailTheme.footerText};">
                <a href="${escapeHtml(siteUrl)}" style="color:${emailTheme.footerText};text-decoration:none;font-weight:600;">${escapeHtml(siteName)}</a>
                ${
                  supportEmail
                    ? ` · <a href="mailto:${escapeHtml(supportEmail)}" style="color:${emailTheme.footerMuted};text-decoration:none;">${escapeHtml(supportEmail)}</a>`
                    : ""
                }
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:11px;line-height:1.5;color:${emailTheme.faint};max-width:560px;">
          This email was sent by ${escapeHtml(siteName)}. Please do not reply to automated messages unless instructed.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function emailButton(href: string, label: string) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 4px;">
  <tr>
    <td style="border-radius:8px;background:${emailTheme.buttonBg};">
      <a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 20px;font-size:14px;font-weight:600;color:${emailTheme.buttonText};text-decoration:none;border-radius:8px;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;
}

export function textToEmailParagraphs(text: string) {
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;">&nbsp;</p>`;
      }
      return `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${emailTheme.body};">${escapeHtml(trimmed)}</p>`;
    })
    .join("");
}

export function emailDetailTable(rows: { label: string; value: string; mono?: boolean }[]) {
  const body = rows
    .map((row) => {
      const valueStyle = row.mono
        ? `font-family:${emailTheme.mono};font-size:13px;font-weight:600;color:${emailTheme.ink};word-break:break-all;`
        : `font-size:14px;font-weight:600;color:${emailTheme.ink};word-break:break-word;`;
      return `<tr>
  <td style="padding:10px 0;border-bottom:1px solid ${emailTheme.rule};vertical-align:top;width:38%;font-size:13px;color:${emailTheme.muted};">${escapeHtml(row.label)}</td>
  <td style="padding:10px 0 10px 16px;border-bottom:1px solid ${emailTheme.rule};vertical-align:top;text-align:right;${valueStyle}">${escapeHtml(row.value)}</td>
</tr>`;
    })
    .join("");

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 20px;border-collapse:collapse;">
${body}
</table>`;
}

export function emailCodeBlock(code: string, hint?: string) {
  const hintHtml = hint
    ? `<p style="margin:12px 0 0;font-size:12px;line-height:1.5;color:${emailTheme.muted};text-align:center;">${escapeHtml(hint)}</p>`
    : "";
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 20px;">
  <tr>
    <td style="background:${emailTheme.codeBg};border:1px solid ${emailTheme.cardBorder};border-radius:10px;padding:22px 16px;text-align:center;">
      <p style="margin:0;font-family:${emailTheme.mono};font-size:28px;font-weight:700;letter-spacing:0.28em;color:${emailTheme.ink};">${escapeHtml(code)}</p>
      ${hintHtml}
    </td>
  </tr>
</table>`;
}

export function emailQuote(text: string) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 20px;">
  <tr>
    <td style="border-left:3px solid ${emailTheme.accent};background:${emailTheme.accentSoft};padding:14px 16px;border-radius:0 8px 8px 0;">
      <p style="margin:0;font-size:14px;line-height:1.65;color:${emailTheme.body};white-space:pre-wrap;">${escapeHtml(text)}</p>
    </td>
  </tr>
</table>`;
}

export function emailStatusPill(label: string) {
  return `<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${emailTheme.accentSoft};color:${emailTheme.accent};font-size:12px;font-weight:650;letter-spacing:0.02em;">${escapeHtml(label)}</span>`;
}

export function stripSignatureFooter(text: string) {
  return text.replace(/\n—\s*[\s\S]*$/, "").trimEnd();
}
