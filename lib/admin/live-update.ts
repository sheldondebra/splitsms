import { prisma } from "@/lib/db";

export type LiveMessageEvent = {
  id: string;
  kind: "message";
  at: string;
  status: string;
  recipient: string;
  senderId: string;
  bodyPreview: string;
  failureReason: string | null;
  countryCode: string | null;
  campaignId: string | null;
  campaignName: string | null;
  campaignTotal: number | null;
  memberId: string;
  memberName: string;
  memberPhone: string;
};

export type LivePaymentEvent = {
  id: string;
  kind: "payment";
  at: string;
  status: string;
  amount: string;
  currency: string;
  method: string;
  memberId: string;
  memberName: string;
  memberPhone: string;
};

export type LiveCampaignProgress = {
  id: string;
  name: string;
  status: string;
  memberId: string;
  memberName: string;
  memberPhone: string;
  recipientCount: number;
  pending: number;
  processing: number;
  sent: number;
  delivered: number;
  failed: number;
  done: number;
  percent: number;
  updatedAt: string;
};

export type LiveUpdateSnapshot = {
  generatedAt: string;
  pingMs: number;
  stats: {
    pending: number;
    processing: number;
    failedLast15m: number;
    sentLast15m: number;
    paymentsPending: number;
    activeCampaigns: number;
  };
  campaigns: LiveCampaignProgress[];
  events: Array<LiveMessageEvent | LivePaymentEvent>;
};

function previewBody(body: string) {
  const trimmed = body.replace(/\s+/g, " ").trim();
  return trimmed.length > 90 ? `${trimmed.slice(0, 90)}…` : trimmed;
}

export async function getAdminLiveUpdateSnapshot(): Promise<LiveUpdateSnapshot> {
  const t0 = Date.now();
  const since15 = new Date(Date.now() - 15 * 60 * 1000);
  const since60 = new Date(Date.now() - 60 * 60 * 1000);

  const [
    pending,
    processing,
    failedLast15m,
    sentLast15m,
    paymentsPending,
    activeCampaigns,
    recentMessages,
    recentPayments,
    sendingCampaigns,
  ] = await Promise.all([
    prisma.message.count({ where: { status: "PENDING", isSandbox: false } }),
    prisma.message.count({ where: { status: "PROCESSING", isSandbox: false } }),
    prisma.message.count({
      where: { status: "FAILED", isSandbox: false, failedAt: { gte: since15 } },
    }),
    prisma.message.count({
      where: {
        isSandbox: false,
        status: { in: ["SENT", "DELIVERED"] },
        OR: [{ sentAt: { gte: since15 } }, { sentAt: null, createdAt: { gte: since15 } }],
      },
    }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.campaign.count({ where: { status: { in: ["SENDING", "SCHEDULED"] } } }),
    prisma.message.findMany({
      where: {
        isSandbox: false,
        OR: [
          { createdAt: { gte: since60 } },
          { status: { in: ["PENDING", "PROCESSING"] } },
          { failedAt: { gte: since15 } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 40,
      select: {
        id: true,
        status: true,
        recipient: true,
        senderId: true,
        body: true,
        failureReason: true,
        countryCode: true,
        campaignId: true,
        createdAt: true,
        updatedAt: true,
        sentAt: true,
        failedAt: true,
        campaign: { select: { name: true, recipientCount: true } },
        user: { select: { id: true, fullName: true, phone: true } },
      },
    }),
    prisma.payment.findMany({
      where: {
        OR: [{ status: "PENDING" }, { createdAt: { gte: since60 } }],
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        amount: true,
        currency: true,
        method: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, fullName: true, phone: true } },
      },
    }),
    prisma.campaign.findMany({
      where: { status: { in: ["SENDING", "SCHEDULED"] } },
      orderBy: { updatedAt: "desc" },
      take: 12,
      select: {
        id: true,
        name: true,
        status: true,
        recipientCount: true,
        updatedAt: true,
        user: { select: { id: true, fullName: true, phone: true } },
      },
    }),
  ]);

  const campaignIds = sendingCampaigns.map((c) => c.id);
  const statusGroups =
    campaignIds.length === 0
      ? []
      : await prisma.message.groupBy({
          by: ["campaignId", "status"],
          where: { campaignId: { in: campaignIds }, isSandbox: false },
          _count: { _all: true },
        });

  const byCampaign = new Map<string, Record<string, number>>();
  for (const row of statusGroups) {
    if (!row.campaignId) continue;
    const bucket = byCampaign.get(row.campaignId) ?? {};
    bucket[row.status] = row._count._all;
    byCampaign.set(row.campaignId, bucket);
  }

  const campaigns: LiveCampaignProgress[] = sendingCampaigns.map((c) => {
    const counts = byCampaign.get(c.id) ?? {};
    const pendingCount = counts.PENDING ?? 0;
    const processingCount = counts.PROCESSING ?? 0;
    const sent = counts.SENT ?? 0;
    const delivered = counts.DELIVERED ?? 0;
    const failed = counts.FAILED ?? 0;
    const done = sent + delivered + failed;
    const total = Math.max(c.recipientCount || done + pendingCount + processingCount, 1);
    const percent = Math.min(100, Math.round((done / total) * 100));
    return {
      id: c.id,
      name: c.name,
      status: c.status,
      memberId: c.user.id,
      memberName: c.user.fullName,
      memberPhone: c.user.phone,
      recipientCount: c.recipientCount,
      pending: pendingCount,
      processing: processingCount,
      sent,
      delivered,
      failed,
      done,
      percent,
      updatedAt: c.updatedAt.toISOString(),
    };
  });

  const messageEvents: LiveMessageEvent[] = recentMessages.map((m) => ({
    id: m.id,
    kind: "message" as const,
    at: (m.failedAt ?? m.sentAt ?? m.updatedAt ?? m.createdAt).toISOString(),
    status: m.status,
    recipient: m.recipient,
    senderId: m.senderId,
    bodyPreview: previewBody(m.body),
    failureReason: m.failureReason,
    countryCode: m.countryCode,
    campaignId: m.campaignId,
    campaignName: m.campaign?.name ?? null,
    campaignTotal: m.campaign?.recipientCount ?? null,
    memberId: m.user.id,
    memberName: m.user.fullName,
    memberPhone: m.user.phone,
  }));

  const paymentEvents: LivePaymentEvent[] = recentPayments.map((p) => ({
    id: p.id,
    kind: "payment" as const,
    at: p.updatedAt.toISOString(),
    status: p.status,
    amount: p.amount.toString(),
    currency: p.currency,
    method: p.method,
    memberId: p.user.id,
    memberName: p.user.fullName,
    memberPhone: p.user.phone,
  }));

  const events = [...messageEvents, ...paymentEvents]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 50);

  return {
    generatedAt: new Date().toISOString(),
    pingMs: Date.now() - t0,
    stats: {
      pending,
      processing,
      failedLast15m,
      sentLast15m,
      paymentsPending,
      activeCampaigns,
    },
    campaigns,
    events,
  };
}
