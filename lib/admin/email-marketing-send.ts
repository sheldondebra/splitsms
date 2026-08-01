import { prisma } from "@/lib/db";
import { marketingEmailContent } from "@/lib/admin/email-marketing-render";
import type { MarketingRecipient } from "@/lib/admin/email-marketing-audience";
import type { EmailMarketingAudienceType } from "@/lib/admin/email-marketing-shared";
import type { Prisma } from "@/lib/generated/prisma/client";

export type SendMarketingCampaignInput = {
  adminId: string;
  name?: string;
  templateId?: string | null;
  subject: string;
  preheader?: string;
  headline: string;
  bodyText: string;
  ctaLabel?: string;
  ctaHref?: string;
  footerNote?: string;
  audienceType: EmailMarketingAudienceType;
  audienceMeta?: Prisma.InputJsonValue;
  recipients: MarketingRecipient[];
};

export async function sendMarketingCampaign(input: SendMarketingCampaignInput) {
  const { sendEmail } = await import("@/lib/email");

  const campaign = await prisma.emailMarketingCampaign.create({
    data: {
      name: input.name?.trim() || input.subject.slice(0, 80),
      templateId: input.templateId || null,
      subject: input.subject,
      preheader: input.preheader || null,
      headline: input.headline,
      bodyText: input.bodyText,
      ctaLabel: input.ctaLabel || null,
      ctaHref: input.ctaHref || null,
      footerNote: input.footerNote || null,
      audienceType: input.audienceType,
      audienceMeta: input.audienceMeta ?? {},
      status: "SENDING",
      recipientCount: input.recipients.length,
      createdById: input.adminId,
    },
  });

  let sent = 0;
  let failed = 0;

  for (const recipient of input.recipients) {
    const content = await marketingEmailContent({
      recipientName: recipient.fullName,
      subject: input.subject,
      preheader: input.preheader,
      headline: input.headline,
      bodyText: input.bodyText,
      ctaLabel: input.ctaLabel,
      ctaHref: input.ctaHref,
      footerNote: input.footerNote,
    });

    try {
      const result = await sendEmail({
        to: recipient.email,
        subject: content.subject,
        text: content.text,
        html: content.html,
      });
      const ok = Boolean(result && typeof result === "object" && "ok" in result && result.ok);

      if (ok) {
        sent += 1;
        await prisma.emailMarketingDelivery.create({
          data: {
            campaignId: campaign.id,
            userId: recipient.userId,
            email: recipient.email,
            fullName: recipient.fullName,
            status: "sent",
            sentAt: new Date(),
          },
        });
      } else {
        failed += 1;
        const error =
          result && typeof result === "object" && "error" in result
            ? String(result.error ?? "Provider rejected send").slice(0, 500)
            : "Provider rejected send";
        await prisma.emailMarketingDelivery.create({
          data: {
            campaignId: campaign.id,
            userId: recipient.userId,
            email: recipient.email,
            fullName: recipient.fullName,
            status: "failed",
            error,
          },
        });
      }
    } catch (err) {
      failed += 1;
      await prisma.emailMarketingDelivery.create({
        data: {
          campaignId: campaign.id,
          userId: recipient.userId,
          email: recipient.email,
          fullName: recipient.fullName,
          status: "failed",
          error: err instanceof Error ? err.message.slice(0, 500) : "Send failed",
        },
      });
    }
  }

  const status =
    failed === 0 ? "SENT" : sent === 0 ? "FAILED" : "PARTIAL";

  await prisma.emailMarketingCampaign.update({
    where: { id: campaign.id },
    data: {
      status,
      sentCount: sent,
      failedCount: failed,
      completedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: input.adminId,
      action: "ADMIN_EMAIL_MARKETING_SEND",
      entityType: "EmailMarketingCampaign",
      entityId: campaign.id,
      metadata: {
        audienceType: input.audienceType,
        recipientCount: input.recipients.length,
        sent,
        failed,
        subject: input.subject,
      },
    },
  });

  return { campaignId: campaign.id, sent, failed };
}
