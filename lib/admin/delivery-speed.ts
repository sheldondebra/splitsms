import { prisma } from "@/lib/db";
import {
  computeDeliverySpeedStats,
  type DeliverySpeedStats,
} from "@/lib/sms/delivery-speed-stats";

const RECENT_SAMPLE_SIZE = 50;
const RECENT_DIRECT_SAMPLE_SIZE = 25;
const BATCH_WINDOW_DAYS = 14;
const MAX_BATCHES = 30;

/** Speed of the most recently delivered messages, platform-wide. */
export async function getRecentDeliverySpeed(): Promise<DeliverySpeedStats | null> {
  const recent = await prisma.message.findMany({
    where: { status: "DELIVERED", sentAt: { not: null }, deliveredAt: { not: null } },
    orderBy: { deliveredAt: "desc" },
    take: RECENT_SAMPLE_SIZE,
    select: { sentAt: true, deliveredAt: true },
  });
  return computeDeliverySpeedStats(recent);
}

export type CampaignDeliverySpeed = {
  campaignId: string;
  campaignName: string;
  senderId: string | null;
  campaignStatus: string;
  stats: DeliverySpeedStats;
  lastDeliveredAt: string;
};

export type DirectDeliverySpeed = {
  id: string;
  recipient: string;
  senderId: string;
  seconds: number;
  deliveredAt: string;
};

export type DeliverySpeedByBatch = {
  windowDays: number;
  campaigns: CampaignDeliverySpeed[];
  direct: DirectDeliverySpeed[];
};

/** Delivery speed grouped by campaign ("batch") plus recent standalone (non-campaign) sends. */
export async function getDeliverySpeedByBatch(
  windowDays = BATCH_WINDOW_DAYS,
): Promise<DeliverySpeedByBatch> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const [campaignMessages, direct] = await Promise.all([
    prisma.message.findMany({
      where: {
        status: "DELIVERED",
        campaignId: { not: null },
        sentAt: { not: null },
        deliveredAt: { not: null, gte: since },
      },
      select: { campaignId: true, sentAt: true, deliveredAt: true },
    }),
    prisma.message.findMany({
      where: {
        status: "DELIVERED",
        campaignId: null,
        sentAt: { not: null },
        deliveredAt: { not: null },
      },
      orderBy: { deliveredAt: "desc" },
      take: RECENT_DIRECT_SAMPLE_SIZE,
      select: { id: true, recipient: true, senderId: true, sentAt: true, deliveredAt: true },
    }),
  ]);

  const byCampaign = new Map<string, { sentAt: Date; deliveredAt: Date }[]>();
  for (const m of campaignMessages) {
    if (!m.campaignId || !m.sentAt || !m.deliveredAt) continue;
    const list = byCampaign.get(m.campaignId) ?? [];
    list.push({ sentAt: m.sentAt, deliveredAt: m.deliveredAt });
    byCampaign.set(m.campaignId, list);
  }

  const campaignRows = await prisma.campaign.findMany({
    where: { id: { in: [...byCampaign.keys()] } },
    select: { id: true, name: true, senderId: true, status: true },
  });
  const campaignById = new Map(campaignRows.map((c) => [c.id, c]));

  const campaigns: CampaignDeliverySpeed[] = [...byCampaign.entries()]
    .map(([campaignId, msgs]) => {
      const stats = computeDeliverySpeedStats(msgs);
      if (!stats) return null;
      const campaign = campaignById.get(campaignId);
      const lastDeliveredAt = msgs.reduce(
        (max, m) => (m.deliveredAt.getTime() > max ? m.deliveredAt.getTime() : max),
        0,
      );
      return {
        campaignId,
        campaignName: campaign?.name ?? "Deleted campaign",
        senderId: campaign?.senderId ?? null,
        campaignStatus: campaign?.status ?? "UNKNOWN",
        stats,
        lastDeliveredAt: new Date(lastDeliveredAt).toISOString(),
      };
    })
    .filter((c): c is CampaignDeliverySpeed => c !== null)
    .sort((a, b) => new Date(b.lastDeliveredAt).getTime() - new Date(a.lastDeliveredAt).getTime())
    .slice(0, MAX_BATCHES);

  const directRows: DirectDeliverySpeed[] = direct
    .filter((m) => m.sentAt && m.deliveredAt)
    .map((m) => ({
      id: m.id,
      recipient: m.recipient,
      senderId: m.senderId,
      seconds: Math.round((m.deliveredAt!.getTime() - m.sentAt!.getTime()) / 1000),
      deliveredAt: m.deliveredAt!.toISOString(),
    }));

  return { windowDays, campaigns, direct: directRows };
}
