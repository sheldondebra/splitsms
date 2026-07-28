import { prisma } from "@/lib/db";

function normalizeScores(values: number[]) {
  const max = Math.max(...values, 0);
  if (max <= 0) return values.map(() => 0);
  return values.map((v) => (v / max) * 100);
}

export async function getAdminResellersDashboard() {
  const activitySince = new Date();
  activitySince.setDate(activitySince.getDate() - 29);
  activitySince.setHours(0, 0, 0, 0);

  const [resellers, candidates, commissionTotals, recentCommissions, globalCommission, platformPricing] =
    await Promise.all([
      prisma.reseller.findMany({
        include: {
          user: { include: { wallet: true, smsCredit: true } },
          branding: { select: { logoUrl: true, primaryColor: true } },
          countryPricing: {
            where: { isActive: true },
            orderBy: { countryCode: "asc" },
            take: 4,
          },
          subUsers: { select: { userId: true, isSuspended: true } },
          _count: { select: { subUsers: true, commissions: true, countryPricing: true } },
        },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      }),
      prisma.user.findMany({
        where: { role: "MEMBER", reseller: null },
        orderBy: { fullName: "asc" },
        take: 80,
        select: { id: true, fullName: true, phone: true },
      }),
      prisma.resellerCommission.groupBy({
        by: ["resellerId"],
        _sum: { amount: true },
      }),
      prisma.resellerCommission.findMany({
        where: { createdAt: { gte: activitySince } },
        select: { resellerId: true, amount: true, createdAt: true },
      }),
      prisma.resellerCommission.aggregate({ _sum: { amount: true } }),
      prisma.smsPricing.findMany({
        where: { isActive: true },
        include: { country: { select: { code: true, name: true } } },
        orderBy: { country: { name: "asc" } },
      }),
    ]);

  const subUserToReseller = new Map<string, string>();
  for (const reseller of resellers) {
    for (const subUser of reseller.subUsers) {
      subUserToReseller.set(subUser.userId, reseller.id);
    }
  }

  const allSubUserIds = Array.from(subUserToReseller.keys());

  const [recentMessages, clientWallets, clientCredits] = await Promise.all([
    allSubUserIds.length
      ? prisma.message.findMany({
          where: {
            userId: { in: allSubUserIds },
            createdAt: { gte: activitySince },
          },
          select: { userId: true, createdAt: true, smsUnits: true, cost: true },
        })
      : Promise.resolve([]),
    allSubUserIds.length
      ? prisma.wallet.findMany({
          where: { userId: { in: allSubUserIds } },
          select: { userId: true, balance: true, currency: true },
        })
      : Promise.resolve([]),
    allSubUserIds.length
      ? prisma.smsCredit.findMany({
          where: { userId: { in: allSubUserIds } },
          select: { userId: true, balance: true },
        })
      : Promise.resolve([]),
  ]);

  const earnedMap = new Map(
    commissionTotals.map((c) => [c.resellerId, c._sum.amount?.toNumber() ?? 0]),
  );
  const sms30dMap = new Map<string, number>();
  const spend30dMap = new Map<string, number>();
  const clientWalletMap = new Map<string, number>();
  const clientCreditsMap = new Map<string, number>();

  for (const message of recentMessages) {
    const resellerId = subUserToReseller.get(message.userId);
    if (!resellerId) continue;
    sms30dMap.set(resellerId, (sms30dMap.get(resellerId) ?? 0) + message.smsUnits);
    spend30dMap.set(resellerId, (spend30dMap.get(resellerId) ?? 0) + (message.cost?.toNumber() ?? 0));
  }

  for (const wallet of clientWallets) {
    const resellerId = subUserToReseller.get(wallet.userId);
    if (!resellerId) continue;
    clientWalletMap.set(
      resellerId,
      (clientWalletMap.get(resellerId) ?? 0) + wallet.balance.toNumber(),
    );
  }

  for (const credit of clientCredits) {
    const resellerId = subUserToReseller.get(credit.userId);
    if (!resellerId) continue;
    clientCreditsMap.set(resellerId, (clientCreditsMap.get(resellerId) ?? 0) + credit.balance);
  }

  const baseRows = resellers.map((r) => {
    const ownerWallet = r.user.wallet?.balance.toNumber() ?? 0;
    const ownerCredits = r.user.smsCredit?.balance ?? 0;
    const clientsWallet = clientWalletMap.get(r.id) ?? 0;
    const clientsCredits = clientCreditsMap.get(r.id) ?? 0;
    return {
      ...r,
      commissionEarned: earnedMap.get(r.id) ?? 0,
      smsLast30Days: sms30dMap.get(r.id) ?? 0,
      spendLast30Days: spend30dMap.get(r.id) ?? 0,
      suspendedSubUsers: r.subUsers.filter((s) => s.isSuspended).length,
      ownerWalletBalance: ownerWallet,
      ownerSmsCredits: ownerCredits,
      clientsWalletBalance: clientsWallet,
      clientsSmsCredits: clientsCredits,
      totalFundsUnderManagement: ownerWallet + clientsWallet,
      totalCreditsUnderManagement: ownerCredits + clientsCredits,
      performanceScore: 0,
      performanceRank: 0 as number | null,
      badges: [] as string[],
    };
  });

  const approvedForScore = baseRows.filter((r) => r.status === "APPROVED");
  const commissionNorm = normalizeScores(approvedForScore.map((r) => r.commissionEarned));
  const smsNorm = normalizeScores(approvedForScore.map((r) => r.smsLast30Days));
  const clientsNorm = normalizeScores(approvedForScore.map((r) => r._count.subUsers));
  const spendNorm = normalizeScores(approvedForScore.map((r) => r.spendLast30Days));

  const scoreById = new Map<string, number>();
  approvedForScore.forEach((r, i) => {
    const score =
      commissionNorm[i]! * 0.4 +
      smsNorm[i]! * 0.3 +
      clientsNorm[i]! * 0.2 +
      spendNorm[i]! * 0.1;
    scoreById.set(r.id, Number(score.toFixed(1)));
  });

  const ranked = [...approvedForScore]
    .map((r) => ({
      id: r.id,
      score: scoreById.get(r.id) ?? 0,
      commission: r.commissionEarned,
    }))
    .sort((a, b) => b.score - a.score || b.commission - a.commission);

  const rankById = new Map<string, number>();
  ranked.forEach((item, index) => rankById.set(item.id, index + 1));

  const topEarnerId = [...approvedForScore].sort(
    (a, b) => b.commissionEarned - a.commissionEarned,
  )[0]?.id;
  const topVolumeId = [...approvedForScore].sort(
    (a, b) => b.smsLast30Days - a.smsLast30Days,
  )[0]?.id;
  const topClientsId = [...approvedForScore].sort(
    (a, b) => b._count.subUsers - a._count.subUsers,
  )[0]?.id;
  const topSpendId = [...approvedForScore].sort(
    (a, b) => b.spendLast30Days - a.spendLast30Days,
  )[0]?.id;

  const rows = baseRows.map((r) => {
    const badges: string[] = [];
    if (r.status === "APPROVED") {
      if (r.id === topEarnerId && r.commissionEarned > 0) badges.push("Top earner");
      if (r.id === topVolumeId && r.smsLast30Days > 0) badges.push("Most SMS");
      if (r.id === topClientsId && r._count.subUsers > 0) badges.push("Most clients");
      if (r.id === topSpendId && r.spendLast30Days > 0) badges.push("Highest spend");
    }
    return {
      ...r,
      performanceScore: scoreById.get(r.id) ?? 0,
      performanceRank: rankById.get(r.id) ?? null,
      badges,
    };
  });

  const pending = rows.filter((r) => r.status === "PENDING");
  const approved = rows.filter((r) => r.status === "APPROVED");
  const suspended = rows.filter((r) => r.status === "SUSPENDED" || r.status === "REJECTED");
  const totalSubUsers = rows.reduce((n, r) => n + r._count.subUsers, 0);
  const totalSms30d = rows.reduce((n, r) => n + r.smsLast30Days, 0);
  const totalSpend30d = rows.reduce((n, r) => n + r.spendLast30Days, 0);
  const totalPricingOverrides = rows.reduce((n, r) => n + r._count.countryPricing, 0);
  const activeSubUsers = rows.reduce((n, r) => n + r._count.subUsers - r.suspendedSubUsers, 0);
  const totalOwnerWallets = rows.reduce((n, r) => n + r.ownerWalletBalance, 0);
  const totalClientWallets = rows.reduce((n, r) => n + r.clientsWalletBalance, 0);
  const totalOwnerCredits = rows.reduce((n, r) => n + r.ownerSmsCredits, 0);
  const totalClientCredits = rows.reduce((n, r) => n + r.clientsSmsCredits, 0);

  const dayKey = (date: Date) => date.toISOString().slice(0, 10);
  const dailyActivity = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(activitySince);
    date.setDate(activitySince.getDate() + index);
    return {
      key: dayKey(date),
      date: date.toLocaleDateString("en", { month: "short", day: "numeric" }),
      sms: 0,
      commission: 0,
    };
  });
  const dayMap = new Map(dailyActivity.map((day) => [day.key, day]));

  for (const message of recentMessages) {
    const day = dayMap.get(dayKey(message.createdAt));
    if (day) day.sms += message.smsUnits;
  }
  for (const commission of recentCommissions) {
    const day = dayMap.get(dayKey(commission.createdAt));
    if (day) day.commission += commission.amount.toNumber();
  }

  const topPartners = [...rows]
    .filter((r) => r.status === "APPROVED")
    .sort(
      (a, b) =>
        b.performanceScore - a.performanceScore ||
        b.commissionEarned - a.commissionEarned ||
        b.smsLast30Days - a.smsLast30Days,
    )
    .slice(0, 10)
    .map((r, index) => ({
      id: r.id,
      name: r.businessName,
      commission: r.commissionEarned,
      subUsers: r._count.subUsers,
      sms30d: r.smsLast30Days,
      spend30d: r.spendLast30Days,
      score: r.performanceScore,
      rank: index + 1,
      badges: r.badges,
      ownerWallet: r.ownerWalletBalance,
      clientsWallet: r.clientsWalletBalance,
    }));

  return {
    resellers: rows,
    candidates,
    platformPricing: platformPricing.map((p) => ({
      id: p.id,
      countryCode: p.country.code,
      countryName: p.country.name,
      currency: p.currency,
      memberPrice: p.memberPrice.toNumber(),
      resellerPrice: p.resellerPrice?.toNumber() ?? p.memberPrice.toNumber(),
      costPrice: p.costPrice.toNumber(),
    })),
    charts: {
      statusBreakdown: [
        { name: "Approved", value: approved.length, fill: "#22c55e" },
        { name: "Pending", value: pending.length, fill: "#f59e0b" },
        { name: "Suspended", value: rows.filter((r) => r.status === "SUSPENDED").length, fill: "#ef4444" },
        { name: "Rejected", value: rows.filter((r) => r.status === "REJECTED").length, fill: "#64748b" },
      ].filter((item) => item.value > 0),
      dailyActivity: dailyActivity.map(({ key: _key, ...day }) => ({
        ...day,
        commission: Number(day.commission.toFixed(2)),
      })),
      topPartners,
    },
    stats: {
      total: rows.length,
      pending: pending.length,
      approved: approved.length,
      suspended: suspended.length,
      totalCommissions: globalCommission._sum.amount?.toNumber() ?? 0,
      totalSubUsers,
      activeSubUsers,
      totalSms30d,
      totalSpend30d,
      totalPricingOverrides,
      platformPricingRoutes: platformPricing.length,
      totalOwnerWallets,
      totalClientWallets,
      totalOwnerCredits,
      totalClientCredits,
      totalFundsUnderManagement: totalOwnerWallets + totalClientWallets,
      totalCreditsUnderManagement: totalOwnerCredits + totalClientCredits,
    },
    pending,
    approved,
    suspended,
  };
}

export type AdminResellersDashboard = Awaited<ReturnType<typeof getAdminResellersDashboard>>;
