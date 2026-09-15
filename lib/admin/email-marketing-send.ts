import { prisma } from "@/lib/db";
import { marketingEmailContent } from "@/lib/admin/email-marketing-render";
import {
  resolveMarketingAudience,
  type MarketingRecipient,
} from "@/lib/admin/email-marketing-audience";
import {
  applyEmailMarketingTracking,
  emailMarketingTrackingToken,
  emailMarketingUnsubscribeUrl,
} from "@/lib/admin/email-marketing-track";
import {
  EMAIL_MARKETING_MAX_RECIPIENTS,
  EMAIL_MARKETING_NEWSLETTER_MAX_RECIPIENTS,
  resolveMarketingCtaHref,
  type EmailMarketingAudienceType,
} from "@/lib/admin/email-marketing-shared";
import { setMarketingImage } from "@/lib/admin/email-marketing-images";
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
  imageUrl?: string;
  audienceType: EmailMarketingAudienceType;
  audienceMeta?: Prisma.InputJsonValue;
  recipients: MarketingRecipient[];
  scheduledAt?: Date | null;
};

export async function sendMarketingCampaign(input: SendMarketingCampaignInput) {
  if (input.scheduledAt && input.scheduledAt.getTime() > Date.now() + 15_000) {
    return scheduleMarketingCampaign(input);
  }
  return dispatchMarketingCampaign(input);
}

async function scheduleMarketingCampaign(input: SendMarketingCampaignInput) {
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
      status: "DRAFT",
      recipientCount: input.recipients.length,
      createdById: input.adminId,
    },
  });

  await setMarketingImage("campaign", campaign.id, input.imageUrl?.trim() || null);
  await prisma.emailMarketingCampaignMeta.upsert({
    where: { campaignId: campaign.id },
    create: {
      campaignId: campaign.id,
      scheduledAt: input.scheduledAt ?? undefined,
    },
    update: { scheduledAt: input.scheduledAt ?? undefined },
  });

  await prisma.auditLog.create({
    data: {
      actorId: input.adminId,
      action: "ADMIN_EMAIL_MARKETING_SCHEDULE",
      entityType: "EmailMarketingCampaign",
      entityId: campaign.id,
      metadata: {
        audienceType: input.audienceType,
        scheduledAt: input.scheduledAt?.toISOString(),
        subject: input.subject,
      },
    },
  });

  return { campaignId: campaign.id, sent: 0, failed: 0, scheduled: true as const };
}

export async function dispatchMarketingCampaign(
  input: SendMarketingCampaignInput & { campaignId?: string },
) {
  const { sendEmail } = await import("@/lib/email");

  const campaign =
    input.campaignId
      ? await prisma.emailMarketingCampaign.update({
          where: { id: input.campaignId },
          data: {
            status: "SENDING",
            recipientCount: input.recipients.length,
          },
        })
      : await prisma.emailMarketingCampaign.create({
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

  await setMarketingImage("campaign", campaign.id, input.imageUrl?.trim() || null);
  await prisma.emailMarketingCampaignMeta.upsert({
    where: { campaignId: campaign.id },
    create: { campaignId: campaign.id, dispatchedAt: new Date() },
    update: { dispatchedAt: new Date(), scheduledAt: null },
  });

  const { resolveEmailHeaderImage, resolveEmailBodyImages } = await import(
    "@/lib/email/inline-image"
  );
  const headerImage = await resolveEmailHeaderImage(input.imageUrl);
  const headerImageUrl =
    headerImage.htmlSrc ??
    (input.imageUrl?.trim() ? resolveMarketingCtaHref(input.imageUrl) : undefined);

  const resolvedBody = await resolveEmailBodyImages(input.bodyText);
  const attachments = [
    ...(headerImage.attachment ? [headerImage.attachment] : []),
    ...resolvedBody.attachments,
  ];

  let sent = 0;
  let failed = 0;

  for (const recipient of input.recipients) {
    const delivery = await prisma.emailMarketingDelivery.create({
      data: {
        campaignId: campaign.id,
        userId: recipient.userId,
        email: recipient.email,
        fullName: recipient.fullName,
        status: "queued",
      },
    });
    const token = emailMarketingTrackingToken(delivery.id);
    const unsubscribeUrl = emailMarketingUnsubscribeUrl(token);

    const content = await marketingEmailContent({
      recipientName: recipient.fullName,
      subject: input.subject,
      preheader: input.preheader,
      headline: input.headline,
      bodyText: resolvedBody.html,
      ctaLabel: input.ctaLabel,
      ctaHref: input.ctaHref,
      footerNote: input.footerNote,
      headerImageUrl,
      unsubscribeUrl,
    });

    const html = applyEmailMarketingTracking(content.html, token);
    const headers = {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    };

    try {
      const result = await sendEmail({
        to: recipient.email,
        subject: content.subject,
        text: content.text,
        html,
        attachments: attachments.length ? attachments : undefined,
        headers,
      });
      const ok = Boolean(result && typeof result === "object" && "ok" in result && result.ok);

      if (ok) {
        sent += 1;
        await prisma.emailMarketingDelivery.update({
          where: { id: delivery.id },
          data: { status: "sent", sentAt: new Date() },
        });
      } else {
        failed += 1;
        const error =
          result && typeof result === "object" && "error" in result
            ? String(result.error ?? "Provider rejected send").slice(0, 500)
            : "Provider rejected send";
        await prisma.emailMarketingDelivery.update({
          where: { id: delivery.id },
          data: { status: "failed", error },
        });
      }
    } catch (err) {
      failed += 1;
      await prisma.emailMarketingDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "failed",
          error: err instanceof Error ? err.message.slice(0, 500) : "Send failed",
        },
      });
    }
  }

  const status = failed === 0 ? "SENT" : sent === 0 ? "FAILED" : "PARTIAL";

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

  return { campaignId: campaign.id, sent, failed, scheduled: false as const };
}

export async function sendMarketingTestEmail(input: {
  to: string;
  toName?: string;
  subject: string;
  preheader?: string;
  headline: string;
  bodyText: string;
  ctaLabel?: string;
  ctaHref?: string;
  footerNote?: string;
  imageUrl?: string;
}) {
  const { sendEmail } = await import("@/lib/email");
  const { resolveEmailHeaderImage, resolveEmailBodyImages } = await import(
    "@/lib/email/inline-image"
  );
  const headerImage = await resolveEmailHeaderImage(input.imageUrl);
  const headerImageUrl =
    headerImage.htmlSrc ??
    (input.imageUrl?.trim() ? resolveMarketingCtaHref(input.imageUrl) : undefined);
  const resolvedBody = await resolveEmailBodyImages(input.bodyText);
  const attachments = [
    ...(headerImage.attachment ? [headerImage.attachment] : []),
    ...resolvedBody.attachments,
  ];
  const content = await marketingEmailContent({
    recipientName: input.toName || "there",
    subject: `[Test] ${input.subject}`,
    preheader: input.preheader,
    headline: input.headline,
    bodyText: resolvedBody.html,
    ctaLabel: input.ctaLabel,
    ctaHref: input.ctaHref,
    footerNote: input.footerNote,
    headerImageUrl,
  });
  return sendEmail({
    to: input.to,
    toName: input.toName,
    subject: content.subject,
    text: content.text,
    html: content.html,
    attachments: attachments.length ? attachments : undefined,
  });
}

export async function dispatchDueMarketingCampaigns() {
  const due = await prisma.emailMarketingCampaignMeta.findMany({
    where: {
      scheduledAt: { lte: new Date() },
      dispatchedAt: null,
    },
    take: 8,
  });

  let processed = 0;
  let sent = 0;
  let failed = 0;

  for (const meta of due) {
    const campaign = await prisma.emailMarketingCampaign.findUnique({
      where: { id: meta.campaignId },
    });
    if (!campaign || campaign.status !== "DRAFT") {
      await prisma.emailMarketingCampaignMeta.update({
        where: { campaignId: meta.campaignId },
        data: { dispatchedAt: new Date() },
      });
      continue;
    }

    const image = await prisma.emailMarketingImage.findUnique({
      where: { kind_targetId: { kind: "campaign", targetId: campaign.id } },
    });
    const audienceMeta = (campaign.audienceMeta ?? {}) as {
      inactiveDays?: number;
      manualEmails?: string[];
    };
    const recipients = await resolveMarketingAudience({
      audienceType: campaign.audienceType as EmailMarketingAudienceType,
      inactiveDays: audienceMeta.inactiveDays,
      manualEmails: audienceMeta.manualEmails,
      max:
        campaign.audienceType === "newsletter"
          ? EMAIL_MARKETING_NEWSLETTER_MAX_RECIPIENTS
          : EMAIL_MARKETING_MAX_RECIPIENTS,
    });

    const result = await dispatchMarketingCampaign({
      campaignId: campaign.id,
      adminId: campaign.createdById || "system",
      name: campaign.name ?? undefined,
      templateId: campaign.templateId,
      subject: campaign.subject,
      preheader: campaign.preheader ?? undefined,
      headline: campaign.headline,
      bodyText: campaign.bodyText,
      ctaLabel: campaign.ctaLabel ?? undefined,
      ctaHref: campaign.ctaHref ?? undefined,
      footerNote: campaign.footerNote ?? undefined,
      imageUrl: image?.imageUrl,
      audienceType: campaign.audienceType as EmailMarketingAudienceType,
      audienceMeta: campaign.audienceMeta as Prisma.InputJsonValue | undefined,
      recipients,
    });
    processed += 1;
    sent += result.sent;
    failed += result.failed;
  }

  return { processed, sent, failed };
}
