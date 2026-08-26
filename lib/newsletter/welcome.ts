import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { marketingEmailContent } from "@/lib/admin/email-marketing-render";
import { NEWSLETTER_WELCOME_SLUG } from "@/lib/newsletter/validate";
import { newsletterUnsubscribeToken } from "@/lib/newsletter/unsubscribe-token";
import { getSiteUrl } from "@/lib/site-config";
import { attachTemplateImages } from "@/lib/admin/email-marketing-images";
import { resolveEmailHeaderImage } from "@/lib/email/inline-image";

export async function sendNewsletterWelcome(input: {
  email: string;
  fullName?: string | null;
}) {
  const template = await prisma.emailMarketingTemplate.findUnique({
    where: { slug: NEWSLETTER_WELCOME_SLUG },
  });
  if (!template) return { ok: false as const, error: "missing_template" };

  const [withImage] = await attachTemplateImages([template]);
  const name = input.fullName?.trim() || input.email.split("@")[0] || "there";
  const unsub = `${getSiteUrl()}/newsletter/unsubscribe?email=${encodeURIComponent(input.email)}&token=${newsletterUnsubscribeToken(input.email)}`;
  const headerImage = await resolveEmailHeaderImage(withImage.imageUrl || "/og.png");

  const content = await marketingEmailContent({
    recipientName: name,
    subject: template.subject,
    preheader: template.preheader,
    headline: template.headline,
    bodyText: `${template.bodyText.trim()}\n\nUnsubscribe: ${unsub}`,
    ctaLabel: template.ctaLabel,
    ctaHref: template.ctaHref,
    footerNote: "",
    headerImageUrl: headerImage.htmlSrc,
  });

  return sendEmail({
    to: input.email,
    toName: name,
    subject: content.subject,
    text: content.text,
    html: content.html,
    attachments: headerImage.attachment ? [headerImage.attachment] : undefined,
  });
}
