import { prisma } from "@/lib/db";

const STATUS_COLORS: Record<string, string> = {
  APPROVED: "#22c55e",
  PENDING: "#f59e0b",
  REJECTED: "#ef4444",
};

const PROVIDER_COLORS: Record<string, string> = {
  MNOTIFY: "#8b5cf6",
  TWILIO: "#0ea5e9",
  INFOBIP: "#f97316",
};

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getAdminSenderIdsDashboard() {
  const since30 = daysAgo(30);

  const [
    statusGroups,
    providerGroups,
    mismatchCount,
    recent,
    signups,
    total,
  ] = await Promise.all([
    prisma.senderId.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.senderIdProviderRegistration.groupBy({
      by: ["provider", "status"],
      where: { status: { not: "SKIPPED" } },
      _count: true,
    }),
    prisma.senderId.count({
      where: {
        status: "APPROVED",
        providerRegistrations: {
          none: { status: "APPROVED" },
        },
      },
    }),
    prisma.senderId.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        user: { select: { fullName: true, phone: true } },
        providerRegistrations: true,
      },
    }),
    prisma.senderId.findMany({
      where: { createdAt: { gte: since30 } },
      select: { createdAt: true, status: true },
    }),
    prisma.senderId.count(),
  ]);

  const statusChart = statusGroups.map((g) => ({
    name: g.status,
    value: g._count,
    fill: STATUS_COLORS[g.status] ?? "#94a3b8",
  }));

  const providerChart = (["MNOTIFY", "TWILIO", "INFOBIP"] as const).map((p) => {
    const rows = providerGroups.filter((g) => g.provider === p);
    const approved = rows.find((r) => r.status === "APPROVED")?._count ?? 0;
    const pending = rows.find((r) => r.status === "PENDING")?._count ?? 0;
    const rejected =
      (rows.find((r) => r.status === "REJECTED")?._count ?? 0) +
      (rows.find((r) => r.status === "FAILED")?._count ?? 0);
    return { provider: p, approved, pending, rejected, fill: PROVIDER_COLORS[p] };
  });

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return {
      label: d.toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
      start: (() => {
        const s = new Date();
        s.setDate(s.getDate() - (29 - i));
        s.setHours(0, 0, 0, 0);
        return s;
      })(),
    };
  });

  const signupChart = days.map(({ label, start }) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const day = signups.filter((s) => s.createdAt >= start && s.createdAt < end);
    return {
      date: label,
      registrations: day.length,
      approved: day.filter((s) => s.status === "APPROVED").length,
    };
  });

  const pending = statusGroups.find((g) => g.status === "PENDING")?._count ?? 0;
  const approved = statusGroups.find((g) => g.status === "APPROVED")?._count ?? 0;
  const rejected = statusGroups.find((g) => g.status === "REJECTED")?._count ?? 0;

  return {
    stats: { total, pending, approved, rejected, mismatchCount },
    statusChart,
    providerChart,
    signupChart,
    recent,
  };
}

export type AdminSenderIdsDashboard = Awaited<ReturnType<typeof getAdminSenderIdsDashboard>>;
