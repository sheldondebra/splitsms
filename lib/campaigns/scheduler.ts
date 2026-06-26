import { prisma } from "@/lib/db";
import { dispatchCampaign } from "@/lib/campaigns/dispatch";
import { createNotification } from "@/lib/notifications";

export async function processDueScheduledCampaigns(limit = 10) {
  const due = await prisma.campaign.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: new Date() },
    },
    take: limit,
    orderBy: { scheduledAt: "asc" },
  });

  const results: { id: string; ok: boolean; reason?: string; sent?: number }[] = [];

  for (const campaign of due) {
    await createNotification(
      campaign.userId,
      "SYSTEM",
      "Scheduled campaign started",
      `"${campaign.name}" is now sending.`,
      { campaignId: campaign.id },
    );

    const result = await dispatchCampaign(campaign.id);
    results.push({
      id: campaign.id,
      ok: result.ok,
      reason: result.ok ? undefined : result.reason,
      sent: result.ok ? result.sent : undefined,
    });
  }

  return { processed: results.length, results };
}
