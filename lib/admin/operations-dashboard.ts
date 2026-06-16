import { prisma } from "@/lib/db";
import { getOperationsHealth } from "@/lib/admin/operations-health";

export type OperationsActionItem = {
  id: string;
  kind: "payment" | "sender-id" | "support" | "fraud" | "message";
  priority: "high" | "medium" | "low";
  title: string;
  subtitle: string;
  href: string;
  actionLabel: string;
  createdAt: Date;
};

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export async function getAdminOperationsDashboard() {
  const since7 = daysAgo(7);
  const stuckThreshold = new Date(Date.now() - 30 * 60 * 1000);

  const [
    health,
    pendingPayments,
    pendingSenders,
    openTickets,
    highRiskUsers,
    stuckMessages,
    pendingResellers,
  ] = await Promise.all([
    getOperationsHealth(),
    prisma.payment.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 15,
      include: { user: { select: { id: true, fullName: true, phone: true } } },
    }),
    prisma.senderId.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 15,
      include: { user: { select: { id: true, fullName: true, phone: true } } },
    }),
    prisma.supportTicket.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
      orderBy: { createdAt: "asc" },
      take: 15,
      include: { user: { select: { id: true, fullName: true, phone: true } } },
    }),
    prisma.message
      .groupBy({
        by: ["userId"],
        where: { status: "FAILED", createdAt: { gte: since7 } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 50,
      })
      .then(async (groups) => {
        const filtered = groups.filter((g) => g._count.id >= 20).slice(0, 10);
        if (filtered.length === 0) return [];
        const users = await prisma.user.findMany({
          where: { id: { in: filtered.map((g) => g.userId) } },
          select: { id: true, fullName: true, phone: true },
        });
        const userMap = new Map(users.map((u) => [u.id, u]));
        return filtered.map((g) => ({
          userId: g.userId,
          failed: g._count.id,
          user: userMap.get(g.userId),
        }));
      }),
    prisma.message.count({
      where: { status: "PENDING", createdAt: { lt: stuckThreshold } },
    }),
    prisma.reseller.count({ where: { status: "PENDING" } }),
  ]);

  const actions: OperationsActionItem[] = [];

  for (const p of pendingPayments) {
    actions.push({
      id: `payment-${p.id}`,
      kind: "payment",
      priority: p.method === "MANUAL" ? "high" : "medium",
      title: `${p.user.fullName} — ${p.currency} ${p.amount.toString()}`,
      subtitle: `${p.method} · ${p.user.phone}`,
      href: "/admin/payments",
      actionLabel: "Review payment",
      createdAt: p.createdAt,
    });
  }

  for (const s of pendingSenders) {
    actions.push({
      id: `sender-${s.id}`,
      kind: "sender-id",
      priority: "high",
      title: `Sender ID: ${s.value}`,
      subtitle: `${s.user.fullName} · ${s.user.phone}`,
      href: "/admin/sender-ids",
      actionLabel: "Approve sender",
      createdAt: s.createdAt,
    });
  }

  for (const t of openTickets) {
    actions.push({
      id: `ticket-${t.id}`,
      kind: "support",
      priority: t.status === "OPEN" ? "high" : "medium",
      title: t.subject,
      subtitle: `${t.user.fullName} · ${t.status}`,
      href: "/admin/support",
      actionLabel: "Handle ticket",
      createdAt: t.createdAt,
    });
  }

  for (const f of highRiskUsers) {
    if (!f.user) continue;
    actions.push({
      id: `fraud-${f.userId}`,
      kind: "fraud",
      priority: "high",
      title: f.user.fullName,
      subtitle: `${f.failed} failed SMS (7d) · ${f.user.phone}`,
      href: `/admin/members/${f.userId}`,
      actionLabel: "Review account",
      createdAt: since7,
    });
  }

  if (stuckMessages > 0) {
    actions.push({
      id: "stuck-messages",
      kind: "message",
      priority: "high",
      title: `${stuckMessages} messages stuck pending`,
      subtitle: "Pending over 30 minutes — check Redis worker and providers",
      href: "/admin/providers",
      actionLabel: "Check providers",
      createdAt: new Date(),
    });
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  actions.sort(
    (a, b) =>
      priorityOrder[a.priority] - priorityOrder[b.priority] ||
      a.createdAt.getTime() - b.createdAt.getTime(),
  );

  const attentionCount =
    pendingPayments.length +
    pendingSenders.length +
    openTickets.filter((t) => t.status === "OPEN").length +
    highRiskUsers.length +
    (stuckMessages > 0 ? 1 : 0) +
    pendingResellers;

  return {
    health,
    actions,
    counts: {
      attention: attentionCount,
      payments: pendingPayments.length,
      senderIds: pendingSenders.length,
      support: openTickets.length,
      openSupport: openTickets.filter((t) => t.status === "OPEN").length,
      fraud: highRiskUsers.length,
      resellers: pendingResellers,
      stuckMessages,
    },
  };
}
