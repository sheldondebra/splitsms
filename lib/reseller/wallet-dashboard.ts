import { prisma } from "@/lib/db";
import { getUnpaidCommissionTotal } from "@/lib/reseller/payout";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayLabels(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (count - 1 - i));
    d.setHours(0, 0, 0, 0);
    return {
      key: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
      start: d,
    };
  });
}

export async function getResellerWalletDashboard(resellerId: string, resellerUserId: string) {
  const since30 = daysAgo(29);
  const since7 = daysAgo(6);

  const [
    wallet,
    unpaid,
    links,
    commissions,
    fundingTx,
    recentTx,
    paidAgg,
    unpaidRows,
    smsCredit,
  ] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: resellerUserId } }),
    getUnpaidCommissionTotal(resellerId),
    prisma.resellerUser.findMany({
      where: { resellerId },
      include: {
        user: {
          include: {
            wallet: true,
            smsCredit: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.resellerCommission.findMany({
      where: { resellerId, createdAt: { gte: since30 } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.transaction.findMany({
      where: {
        userId: resellerUserId,
        type: "RESELLER_SUB_FUND",
        createdAt: { gte: since30 },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.transaction.findMany({
      where: { userId: resellerUserId },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.resellerCommission.aggregate({
      where: { resellerId, paidAt: { not: null }, createdAt: { gte: since30 } },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.resellerCommission.findMany({
      where: { resellerId, paidAt: null },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.smsCredit.findUnique({ where: { userId: resellerUserId } }),
  ]);

  const currency = wallet?.currency ?? "GHS";
  const balance = wallet?.balance.toNumber() ?? 0;
  const smsCredits = smsCredit?.balance ?? 0;

  const activeClients = links.filter((l) => !l.isSuspended);
  const clientWalletsTotal = links.reduce(
    (sum, l) => sum + Number(l.user.wallet?.balance ?? 0),
    0,
  );
  const clientCreditsTotal = links.reduce(
    (sum, l) => sum + (l.user.smsCredit?.balance ?? 0),
    0,
  );
  const lowCreditClients = links
    .filter((l) => !l.isSuspended && (l.user.smsCredit?.balance ?? 0) < 50)
    .map((l) => ({
      id: l.userId,
      fullName: l.user.fullName,
      phone: l.user.phone,
      credits: l.user.smsCredit?.balance ?? 0,
      walletBalance: Number(l.user.wallet?.balance ?? 0),
      countryCode: l.user.countryCode,
    }))
    .sort((a, b) => a.credits - b.credits);

  const fundedOut30d = fundingTx.reduce((sum, t) => sum + t.amount.toNumber(), 0);
  const commissionEarned30d = commissions.reduce((sum, c) => sum + c.amount.toNumber(), 0);

  const fundingByDay = dayLabels(30).map((day) => {
    const next = new Date(day.start);
    next.setDate(next.getDate() + 1);
    const dayTx = fundingTx.filter((t) => t.createdAt >= day.start && t.createdAt < next);
    const dayComm = commissions.filter((c) => c.createdAt >= day.start && c.createdAt < next);
    return {
      date: day.label,
      funded: Number(dayTx.reduce((s, t) => s + t.amount.toNumber(), 0).toFixed(2)),
      commission: Number(dayComm.reduce((s, c) => s + c.amount.toNumber(), 0).toFixed(2)),
    };
  });

  const fundingByClientMap = new Map<string, { name: string; amount: number }>();
  for (const tx of fundingTx) {
    const meta = tx.metadata as { subUserId?: string } | null;
    const subUserId = meta?.subUserId;
    if (!subUserId) continue;
    const client = links.find((l) => l.userId === subUserId);
    const name = client?.user.fullName ?? "Unknown client";
    const prev = fundingByClientMap.get(subUserId) ?? { name, amount: 0 };
    prev.amount += tx.amount.toNumber();
    fundingByClientMap.set(subUserId, prev);
  }
  const fundingByClient = [...fundingByClientMap.values()]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8)
    .map((row) => ({
      name: row.name,
      amount: Number(row.amount.toFixed(2)),
    }));

  const clients = activeClients.map((l) => ({
    id: l.userId,
    fullName: l.user.fullName,
    phone: l.user.phone,
    countryCode: l.user.countryCode,
    credits: l.user.smsCredit?.balance ?? 0,
    walletBalance: Number(l.user.wallet?.balance ?? 0),
  }));

  // last 7 days summary for hero chips
  const funding7d = fundingTx
    .filter((t) => t.createdAt >= since7)
    .reduce((s, t) => s + t.amount.toNumber(), 0);
  const commission7d = commissions
    .filter((c) => c.createdAt >= since7)
    .reduce((s, c) => s + c.amount.toNumber(), 0);

  return {
    currency,
    balance,
    smsCredits,
    unpaid,
    stats: {
      fundedOut30d,
      funding7d,
      commissionEarned30d,
      commission7d,
      paidCommission30d: paidAgg._sum.amount?.toNumber() ?? 0,
      paidCommissionCount30d: paidAgg._count.id,
      clientWalletsTotal,
      clientCreditsTotal,
      activeClients: activeClients.length,
      lowCreditCount: lowCreditClients.length,
      unpaidCount: unpaidRows.length,
    },
    charts: {
      fundingByDay,
      fundingByClient,
    },
    clients,
    lowCreditClients,
    unpaidCommissions: unpaidRows.map((c) => ({
      id: c.id,
      amount: c.amount.toNumber(),
      currency: c.currency,
      source: c.source,
      createdAt: c.createdAt.toISOString(),
    })),
    recentTransactions: recentTx.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount.toNumber(),
      currency: t.currency,
      credits: t.credits,
      description: t.description,
      createdAt: t.createdAt.toISOString(),
      status: t.status,
    })),
  };
}

export type ResellerWalletDashboard = Awaited<ReturnType<typeof getResellerWalletDashboard>>;
