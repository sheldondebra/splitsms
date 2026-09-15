import { prisma } from "@/lib/db";
import { unsubscribeNewsletter } from "@/lib/newsletter/subscribe";

export type EmailMarketingEventKind = "open" | "click" | "unsubscribe";

export async function recordEmailMarketingEvent(input: {
  campaignId: string;
  deliveryId: string;
  email: string;
  kind: EmailMarketingEventKind;
  url?: string | null;
}) {
  const existing = await prisma.emailMarketingEvent.findFirst({
    where: {
      deliveryId: input.deliveryId,
      kind: input.kind,
    },
    select: { id: true },
  });

  await prisma.emailMarketingEvent.create({
    data: {
      campaignId: input.campaignId,
      deliveryId: input.deliveryId,
      email: input.email,
      kind: input.kind,
      url: input.url?.slice(0, 2000) || null,
    },
  });

  if (existing) return { first: false };

  const field =
    input.kind === "open"
      ? "uniqueOpenCount"
      : input.kind === "click"
        ? "uniqueClickCount"
        : "unsubscribeCount";

  await prisma.emailMarketingCampaignMeta.upsert({
    where: { campaignId: input.campaignId },
    create: {
      campaignId: input.campaignId,
      [field]: 1,
    },
    update: { [field]: { increment: 1 } },
  });

  return { first: true };
}

export async function suppressMarketingEmail(
  email: string,
  reason = "unsubscribe",
) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;
  await prisma.emailMarketingSuppression.upsert({
    where: { email: normalized },
    create: { email: normalized, reason, source: "campaign" },
    update: { reason },
  });
  await unsubscribeNewsletter(normalized).catch(() => false);
}

export async function loadDeliveryForTracking(deliveryId: string) {
  return prisma.emailMarketingDelivery.findUnique({
    where: { id: deliveryId },
    select: {
      id: true,
      campaignId: true,
      email: true,
    },
  });
}
