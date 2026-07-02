import { prisma } from "@/lib/db";
import { processMessageJob } from "@/lib/queue/process-message";
import { syncAllSendingCampaigns } from "@/lib/campaigns/sync-status";

export async function processPendingMessagesBatch(limit = 25) {
  const messages = await prisma.message.findMany({
    where: { status: "PENDING", isSandbox: false },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true, countryCode: true },
  });

  let processed = 0;
  let sent = 0;
  let failed = 0;

  for (const msg of messages) {
    const routingCountry =
      msg.countryCode && msg.countryCode.length === 2 ? msg.countryCode : "GH";
    await processMessageJob(msg.id, routingCountry);
    processed++;

    const updated = await prisma.message.findUnique({
      where: { id: msg.id },
      select: { status: true },
    });
    if (updated?.status === "SENT" || updated?.status === "DELIVERED") sent++;
    else if (updated?.status === "FAILED") failed++;
  }

  const remaining = await prisma.message.count({ where: { status: "PENDING", isSandbox: false } });
  await syncAllSendingCampaigns();

  return { processed, sent, failed, remaining };
}
