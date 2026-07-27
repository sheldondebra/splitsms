import { prisma } from "@/lib/db";

export async function getAdminResellersDashboard() {
  const activitySince = new Date();
  activitySince.setDate(activitySince.getDate() - 29);
  activitySince.setHours(0, 0, 0, 0);

  const [resellers, candidates, commissionTotals, recentCommissions, globalCommission, platformPricing] = await Promise.all([
    prisma.reseller.findMany({
      include: {
        user: { include: { wallet: true } },
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

  const recentMessages = subUserToReseller.size
    ? await prisma.message.findMany({
        where: {
          userId: { in: Array.from(subUserToReseller.keys()) },
          createdAt: { gte: activitySince },
        },
        select: { userId: true, createdAt: true, smsUnits: true, cost: true },
      })
    : [];

  const earnedMap = new Map(
    commissionTotals.map((c) => [c.resellerId, c._sum.amount?.toNumber() ?? 0]),
  );
  const sms30dMap = new Map<string, number>();
  const spend30dMap = new Map<string, number>();

  for (const message of recentMessages) {
    const resellerId = subUserToReseller.get(message.userId);
    if (!resellerId) continue;
    sms30dMap.set(resellerId, (sms30dMap.get(resellerId) ?? 0) + message.smsUnits);
    spend30dMap.set(resellerId, (spend30dMap.get(resellerId) ?? 0) + (message.cost?.toNumber() ?? 0));
  }

  const rows = resellers.map((r) => ({
    ...r,
    commissionEarned: earnedMap.get(r.id) ?? 0,
    smsLast30Days: sms30dMap.get(r.id) ?? 0,
    spendLast30Days: spend30dMap.get(r.id) ?? 0,
    suspendedSubUsers: r.subUsers.filter((s) => s.isSuspended).length,
  }));

  const pending = rows.filter((r) => r.status === "PENDING");
  const approved = rows.filter((r) => r.status === "APPROVED");
  const suspended = rows.filter((r) => r.status === "SUSPENDED" || r.status === "REJECTED");
  const totalSubUsers = rows.reduce((n, r) => n + r._count.subUsers, 0);
  const totalSms30d = rows.reduce((n, r) => n + r.smsLast30Days, 0);
  const totalSpend30d = rows.reduce((n, r) => n + r.spendLast30Days, 0);
  const totalPricingOverrides = rows.reduce((n, r) => n + r._count.countryPricing, 0);
  const activeSubUsers = rows.reduce((n, r) => n + r._count.subUsers - r.suspendedSubUsers, 0);

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
    .sort((a, b) => b.commissionEarned - a.commissionEarned || b.smsLast30Days - a.smsLast30Days)
    .slice(0, 8)
    .map((r) => ({
      id: r.id,
      name: r.businessName,
      commission: r.commissionEarned,
      subUsers: r._count.subUsers,
      sms30d: r.smsLast30Days,
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
    },
    pending,
    approved,
    suspended,
  };
}

export type AdminResellersDashboard = Awaited<ReturnType<typeof getAdminResellersDashboard>>;
