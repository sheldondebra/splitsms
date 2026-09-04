import { getSiteUrl, siteName } from "@/lib/site-config";

/** Where a full-width header image sits relative to the headline. */
export type EmailHeaderImagePosition = "above" | "below";

/** Brand tokens — grayscale shell, one accent on the button. */
const emailTheme = {
  pageBg: "#f5f5f5",
  cardBg: "#ffffff",
  cardBorder: "#e8e8e8",
  ink: "#111111",
  body: "#444444",
  muted: "#666666",
  faint: "#888888",
  rule: "#ececec",
  accent: "#111111",
  accentSoft: "#fafafa",
  codeBg: "#fafafa",
  buttonBg: "#111111",
  buttonText: "#ffffff",
  footerBg: "#ffffff",
  footerText: "#666666",
  footerMuted: "#888888",
  font: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
  mono: "ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace",
} as const;

/** Hostname shown in the email footer, e.g. www.splitsms.com */
export function publicSiteHost() {
  try {
    const host = new URL(getSiteUrl()).host;
    return host.startsWith("www.") ? host : `www.${host}`;
  } catch {
    return "www.splitsms.com";
  }
}

/** Make relative image/CTA paths fetchable in Gmail and Apple Mail. */
export function absoluteEmailUrl(url: string) {
  const raw = url.trim();
  if (!raw) return "";
  if (/^(https?:\/\/|cid:|data:)/i.test(raw)) return raw;
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return `${getSiteUrl()}${path}`;
}

function isGenericFooterNote(note: string) {
  return /receiving this because|you have a splitsms account|subscribed to the splitsms/i.test(
    note,
  );
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Footer contact email — kept separate from the transactional `supportEmail` config. */
export const footerContactEmail = "hello@splitsms.com";

/** Footer link with a hosted icon (not a data: URI — many clients, Gmail included,
 * refuse to render those and show a broken box instead). */
function footerIconLink(iconUrl: string, href: string, label: string, color: string) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="display:inline-table;vertical-align:middle;">
  <tr>
    <td style="padding:0 5px 0 0;vertical-align:middle;">
      <img src="${escapeHtml(iconUrl)}" width="13" height="13" alt="" style="display:block;" />
    </td>
    <td style="vertical-align:middle;">
      <a href="${escapeHtml(href)}" style="color:${color};text-decoration:none;font-size:12px;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;
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
  const src = url.startsWith("cid:") ? url : absoluteEmailUrl(url);
  return `<tr>
  <td style="padding:0;line-height:0;font-size:0;">
    <img src="${escapeHtml(src)}" alt="" width="560" style="display:block;width:100%;max-width:560px;height:auto;border:0;" />
  </td>
</tr>`;
}

/** Shared layout for every SplitSMS email. One header, one body, one CTA, one footer. */
export function emailLayout(params: EmailLayoutParams) {
  const siteUrl = getSiteUrl();
  const siteHost = publicSiteHost();
  const preheader = params.preheader ?? params.headline;
  const greeting = params.greeting
    ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${emailTheme.ink};">${escapeHtml(params.greeting)}</p>`
    : "";
  const cta =
    params.ctaHref && params.ctaLabel
      ? emailButton(absoluteEmailUrl(params.ctaHref), params.ctaLabel)
      : "";
  const extraNote =
    params.footerNote?.trim() && !isGenericFooterNote(params.footerNote)
      ? `<p style="margin:0 0 10px;font-size:12px;line-height:1.5;color:${emailTheme.muted};">${escapeHtml(params.footerNote.trim())}</p>`
      : "";

  const logoUrl = `${siteUrl}/smslogo.png`;
  const headerBrand = `<a href="${escapeHtml(siteUrl)}" style="text-decoration:none;">
        <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(siteName)}" width="140" height="47" style="display:block;width:140px;height:auto;border:0;" />
      </a>`;

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
  <title>${escapeHtml(params.headline)}</title>
</head>
<body style="margin:0;padding:0;background:${emailTheme.pageBg};font-family:${emailTheme.font};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${emailTheme.pageBg};">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:${emailTheme.cardBg};">
          <tr>
            <td style="padding:28px 32px 8px;">
              ${headerBrand}
            </td>
          </tr>
          ${imageAbove}
          <tr>
            <td style="padding:16px 32px 0;">
              <h1 style="margin:0;font-size:22px;line-height:1.3;font-weight:650;color:${emailTheme.ink};">${escapeHtml(params.headline)}</h1>
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
            <td style="padding:20px 32px 28px;border-top:1px solid ${emailTheme.rule};">
              ${extraNote}
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;line-height:1.5;color:${emailTheme.ink};">${escapeHtml(siteName)}</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding:0 14px 0 0;">
                    ${footerIconLink(`${siteUrl}/email-icons/globe.png`, siteUrl, siteHost, emailTheme.muted)}
                  </td>
                  <td>
                    ${footerIconLink(`${siteUrl}/email-icons/mail.png`, `mailto:${footerContactEmail}`, footerContactEmail, emailTheme.muted)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
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

export function emailNumberedList(items: string[]) {
  const rows = items
    .map(
      (item, i) => `<tr>
  <td valign="top" style="padding:0 10px 10px 0;width:24px;font-size:15px;line-height:1.55;font-weight:600;color:${emailTheme.ink};">${i + 1}.</td>
  <td valign="top" style="padding:0 0 10px;font-size:15px;line-height:1.55;color:${emailTheme.body};">${escapeHtml(item)}</td>
</tr>`,
    )
    .join("");
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 18px;">${rows}</table>`;
}

export function emailSectionHeading(label: string) {
  return `<p style="margin:22px 0 8px;font-size:13px;line-height:1.4;font-weight:700;color:${emailTheme.ink};">${escapeHtml(label)}</p>`;
}

export function emailStatGrid(
  items: { label: string; value: string; hint?: string }[],
) {
  const cells = items.map((item) => {
    const hint = item.hint
      ? `<p style="margin:4px 0 0;font-size:11px;line-height:1.4;color:${emailTheme.muted};">${escapeHtml(item.hint)}</p>`
      : "";
    return `<td width="50%" valign="top" style="padding:4px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${emailTheme.codeBg};border:1px solid ${emailTheme.cardBorder};border-radius:10px;">
    <tr>
      <td style="padding:14px 16px;">
        <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${emailTheme.muted};">${escapeHtml(item.label)}</p>
        <p style="margin:8px 0 0;font-size:22px;line-height:1.2;font-weight:700;letter-spacing:-0.03em;color:${emailTheme.ink};">${escapeHtml(item.value)}</p>
        ${hint}
      </td>
    </tr>
  </table>
</td>`;
  });

  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += 2) {
    const right = cells[i + 1] ?? `<td width="50%" style="padding:4px;"></td>`;
    rows.push(`<tr>${cells[i]}${right}</tr>`);
  }

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:4px 0 12px;">
${rows.join("\n")}
</table>`;
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
