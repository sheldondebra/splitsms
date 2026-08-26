import {
  emailLayout,
  textToEmailParagraphs,
  type EmailHeaderImagePosition,
  type EmailLayoutParams,
} from "@/lib/email/layout";
import { emailHtmlToPlainText, sanitizeMarketingBodyHtml } from "@/lib/email/sanitize-body-html";
import { looksLikeHtml } from "@/lib/admin/email-marketing-body-format";
import {
  buildMarketingVars,
  interpolateMarketing,
  resolveMarketingCtaHref,
} from "@/lib/admin/email-marketing-shared";
import { siteName } from "@/lib/site-config";

export type MarketingEmailContentInput = {
  recipientName: string;
  subject: string;
  preheader?: string | null;
  headline: string;
  bodyText: string;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  footerNote?: string | null;
  headerImageUrl?: string;
  headerImagePosition?: EmailHeaderImagePosition;
};

export function buildMarketingParts(input: MarketingEmailContentInput): {
  subject: string;
  text: string;
  layoutParams: EmailLayoutParams;
} {
  const vars = buildMarketingVars(input.recipientName);
  const subject = interpolateMarketing(input.subject, vars);
  const headline = interpolateMarketing(input.headline, vars);
  const rawBody = interpolateMarketing(input.bodyText, vars);
  const bodyIsHtml = looksLikeHtml(rawBody);
  const bodyHtml = bodyIsHtml ? sanitizeMarketingBodyHtml(rawBody) : textToEmailParagraphs(rawBody);
  const bodyPlainText = bodyIsHtml ? emailHtmlToPlainText(rawBody) : rawBody;
  const preheader = interpolateMarketing(
    input.preheader?.trim() || bodyPlainText.split("\n").find((l) => l.trim()) || headline,
    vars,
  );
  const footerNote = interpolateMarketing(input.footerNote?.trim() || "", vars);
  const ctaLabel = input.ctaLabel?.trim()
    ? interpolateMarketing(input.ctaLabel, vars)
    : undefined;
  const ctaHref = resolveMarketingCtaHref(
    input.ctaHref ? interpolateMarketing(input.ctaHref, vars) : undefined,
  );

  const textParts = [
    `Hi ${vars.firstName},`,
    "",
    bodyPlainText,
    ctaHref && ctaLabel ? `\n${ctaLabel}: ${ctaHref}` : "",
    "",
    `— ${siteName}`,
  ];

  return {
    subject,
    text: textParts.filter(Boolean).join("\n"),
    layoutParams: {
      showLogo: true,
      eyebrow: siteName,
      preheader,
      headline,
      greeting: `Hi ${vars.firstName},`,
      bodyHtml,
      ctaHref,
      ctaLabel,
      footerNote,
      headerImageUrl: input.headerImageUrl,
      headerImagePosition: input.headerImagePosition,
    },
  };
}

/** Client-safe preview. Pass branding in from the server page. */
export function marketingEmailContentPreview(input: MarketingEmailContentInput) {
  const parts = buildMarketingParts(input);
  return {
    subject: parts.subject,
    text: parts.text,
    html: emailLayout(parts.layoutParams),
  };
}
