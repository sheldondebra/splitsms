import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { emitCampaignCompleted } from "@/lib/webhooks/events";
import {
  computeNextScheduledAt,
  shouldScheduleRecurrence,
} from "@/lib/campaigns/recurrence";

/** Mark a campaign completed once all its messages leave the queue. */
export async function syncCampaignStatus(campaignId: string | null | undefined) {
  if (!campaignId) return;

  const pending = await prisma.message.count({
    where: {
      campaignId,
      status: { in: ["PENDING", "PROCESSING"] },
    },
  });
  if (pending > 0) return;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { _count: { select: { messages: true } } },
  });
  if (!campaign || campaign.status !== "SENDING") return;
  if (campaign._count.messages === 0) return;

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: "COMPLETED" },
  });

  await createNotification(
    campaign.userId,
    "CAMPAIGN_COMPLETED",
    "Campaign completed",
    `"${campaign.name}" finished sending to ${campaign.recipientCount} recipients.`,
    { campaignId: campaign.id },
  );

  await emitCampaignCompleted(campaign.userId, {
    id: campaign.id,
    name: campaign.name,
    recipientCount: campaign.recipientCount,
  });

  if (campaign.recurrence !== "NONE") {
    const base = campaign.scheduledAt ?? new Date();
    const nextAt = computeNextScheduledAt(base, campaign.recurrence, campaign.recurrenceDays);
    if (nextAt && shouldScheduleRecurrence(campaign.recurrence, campaign.recurrenceEndAt, nextAt)) {
      await prisma.campaign.create({
        data: {
          userId: campaign.userId,
          name: `${campaign.name} (recurring)`,
          senderId: campaign.senderId,
          message: campaign.message,
          contactGroupId: campaign.contactGroupId ?? undefined,
          countryCode: campaign.countryCode,
          timezone: campaign.timezone,
          recurrence: campaign.recurrence,
          recurrenceDays: campaign.recurrenceDays ?? undefined,
          recurrenceEndAt: campaign.recurrenceEndAt ?? undefined,
          parentCampaignId: campaign.id,
          status: "SCHEDULED",
          scheduledAt: nextAt,
        },
      });

      await createNotification(
        campaign.userId,
        "SYSTEM",
        "Recurring campaign scheduled",
        `Next run of "${campaign.name}" is scheduled for ${nextAt.toISOString()}.`,
        { parentCampaignId: campaign.id },
      );
    }
  }
}

/** Reconcile any SENDING campaigns whose messages are all terminal. */
export async function syncAllSendingCampaigns(limit = 50) {
  const sending = await prisma.campaign.findMany({
    where: { status: "SENDING" },
    orderBy: { updatedAt: "asc" },
    take: limit,
    select: { id: true },
  });

  for (const campaign of sending) {
    await syncCampaignStatus(campaign.id);
  }

  return sending.length;
}
