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
      label: d.toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
      start: d,
    };
  });
}

const TYPE_COLORS: Record<string, string> = {
  WALLET_TOPUP: "#22c55e",
  CREDIT_PURCHASE: "#0ea5e9",
  SMS_DEBIT: "#f59e0b",
  REFUND: "#a855f7",
  ADMIN_ADJUSTMENT: "#6366f1",
  PROMO_CREDIT: "#14b8a6",
  RESELLER_SUB_FUND: "#f97316",
};

export async function getResellerTransactionsDashboard(
  resellerId: string,
  resellerUserId: string,
) {
  const since30 = daysAgo(29);

  const [wallet, transactions, commissions, unpaid] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: resellerUserId } }),
    prisma.transaction.findMany({
      where: { userId: resellerUserId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.resellerCommission.findMany({
      where: { resellerId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    getUnpaidCommissionTotal(resellerId),
  ]);

  const currency = wallet?.currency ?? "GHS";
  const tx30 = transactions.filter((t) => t.createdAt >= since30);
  const comm30 = commissions.filter((c) => c.createdAt >= since30);

  const fundedOut30d = tx30
    .filter((t) => t.type === "RESELLER_SUB_FUND")
    .reduce((s, t) => s + t.amount.toNumber(), 0);
  const topups30d = tx30
    .filter((t) => t.type === "WALLET_TOPUP" || t.type === "ADMIN_ADJUSTMENT")
    .reduce((s, t) => s + t.amount.toNumber(), 0);
  const commission30d = comm30.reduce((s, c) => s + c.amount.toNumber(), 0);
  const paidCommission30d = comm30
    .filter((c) => c.paidAt)
    .reduce((s, c) => s + c.amount.toNumber(), 0);
  const unpaidCount = commissions.filter((c) => !c.paidAt).length;

  const daily = dayLabels(30).map((day) => {
    const next = new Date(day.start);
    next.setDate(next.getDate() + 1);
    const dayTx = tx30.filter((t) => t.createdAt >= day.start && t.createdAt < next);
    const dayComm = comm30.filter((c) => c.createdAt >= day.start && c.createdAt < next);
    return {
      date: day.label,
      wallet: Number(
        dayTx.reduce((s, t) => s + t.amount.toNumber(), 0).toFixed(2),
      ),
      commission: Number(
        dayComm.reduce((s, c) => s + c.amount.toNumber(), 0).toFixed(2),
      ),
      count: dayTx.length + dayComm.length,
    };
  });

  const typeCounts = new Map<string, number>();
  for (const t of tx30) {
    typeCounts.set(t.type, (typeCounts.get(t.type) ?? 0) + 1);
  }
  const typeBreakdown = [...typeCounts.entries()]
    .map(([name, value]) => ({
      name: name.replace(/_/g, " "),
      raw: name,
      value,
      color: TYPE_COLORS[name] ?? "#94a3b8",
    }))
    .sort((a, b) => b.value - a.value);

  const commissionStatus = [
    {
      name: "Unpaid",
      value: commissions.filter((c) => !c.paidAt).length,
      color: "#f59e0b",
    },
    {
      name: "Paid out",
      value: commissions.filter((c) => c.paidAt).length,
      color: "#22c55e",
    },
  ].filter((row) => row.value > 0);

  return {
    currency,
    walletBalance: wallet?.balance.toNumber() ?? 0,
    unpaid,
    stats: {
      fundedOut30d,
      topups30d,
      commission30d,
      paidCommission30d,
      unpaidCount,
      transactionCount: transactions.length,
      commissionCount: commissions.length,
      activity30d: tx30.length + comm30.length,
    },
    charts: {
      daily,
      typeBreakdown,
      commissionStatus,
    },
    transactions: transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount.toNumber(),
      currency: t.currency,
      credits: t.credits,
      description: t.description,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
      balanceBefore: t.balanceBefore?.toNumber() ?? null,
      balanceAfter: t.balanceAfter?.toNumber() ?? null,
    })),
    commissions: commissions.map((c) => ({
      id: c.id,
      amount: c.amount.toNumber(),
      currency: c.currency,
      source: c.source,
      referenceId: c.referenceId,
      paidAt: c.paidAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
    })),
  };
}

export type ResellerTransactionsDashboard = Awaited<
  ReturnType<typeof getResellerTransactionsDashboard>
>;
