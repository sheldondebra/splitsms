import {
  emailLayout,
  textToEmailParagraphs,
} from "@/lib/email/layout";
import {
  buildMarketingVars,
  defaultMarketingContactLine,
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
};

export function marketingEmailContent(input: MarketingEmailContentInput) {
  const vars = buildMarketingVars(input.recipientName);
  const subject = interpolateMarketing(input.subject, vars);
  const headline = interpolateMarketing(input.headline, vars);
  const bodyText = interpolateMarketing(input.bodyText, vars);
  const preheader = interpolateMarketing(
    input.preheader?.trim() || bodyText.split("\n").find((l) => l.trim()) || headline,
    vars,
  );
  const footerNote = interpolateMarketing(
    input.footerNote?.trim() || "You are receiving this because you have an account with us.",
    vars,
  );
  const ctaLabel = input.ctaLabel?.trim()
    ? interpolateMarketing(input.ctaLabel, vars)
    : undefined;
  const ctaHref = resolveMarketingCtaHref(
    input.ctaHref ? interpolateMarketing(input.ctaHref, vars) : undefined,
  );

  const textParts = [
    `Hi ${vars.firstName},`,
    "",
    bodyText,
    ctaHref && ctaLabel ? `\n${ctaLabel}: ${ctaHref}` : "",
    "",
    `— ${siteName}`,
  ];

  const html = emailLayout({
    showLogo: true,
    eyebrow: siteName,
    preheader,
    headline,
    greeting: `Hi ${vars.firstName},`,
    bodyHtml: textToEmailParagraphs(bodyText),
    ctaHref,
    ctaLabel,
    footerNote,
    contactLine: defaultMarketingContactLine(),
  });

  return {
    subject,
    text: textParts.filter(Boolean).join("\n"),
    html,
  };
}
