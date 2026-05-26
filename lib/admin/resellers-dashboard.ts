import { prisma } from "@/lib/db";

export async function getAdminResellersDashboard() {
  const [resellers, candidates, commissionTotals, globalCommission] = await Promise.all([
    prisma.reseller.findMany({
      include: {
        user: { include: { wallet: true } },
        branding: { select: { logoUrl: true, primaryColor: true } },
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
    prisma.resellerCommission.aggregate({ _sum: { amount: true } }),
  ]);

  const earnedMap = new Map(
    commissionTotals.map((c) => [c.resellerId, c._sum.amount?.toNumber() ?? 0]),
  );

  const rows = resellers.map((r) => ({
    ...r,
    commissionEarned: earnedMap.get(r.id) ?? 0,
  }));

  const pending = rows.filter((r) => r.status === "PENDING");
  const approved = rows.filter((r) => r.status === "APPROVED");
  const suspended = rows.filter((r) => r.status === "SUSPENDED" || r.status === "REJECTED");
  const totalSubUsers = rows.reduce((n, r) => n + r._count.subUsers, 0);

  return {
    resellers: rows,
    candidates,
    stats: {
      total: rows.length,
      pending: pending.length,
      approved: approved.length,
      suspended: suspended.length,
      totalCommissions: globalCommission._sum.amount?.toNumber() ?? 0,
      totalSubUsers,
    },
    pending,
    approved,
    suspended,
  };
}

export type AdminResellersDashboard = Awaited<ReturnType<typeof getAdminResellersDashboard>>;
