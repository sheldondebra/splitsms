import { prisma } from "@/lib/db";

export async function getAdminSupportDashboard(q?: string, status?: string) {
  const where = {
    ...(status && status !== "all"
      ? { status: status.toUpperCase() }
      : {}),
    ...(q
      ? {
          OR: [
            { subject: { contains: q, mode: "insensitive" as const } },
            { message: { contains: q, mode: "insensitive" as const } },
            ...( /^\d+$/.test(q.trim())
              ? [{ reference: Number.parseInt(q.trim(), 10) }]
              : q.trim().startsWith("#") && /^\#\d+$/.test(q.trim())
                ? [{ reference: Number.parseInt(q.trim().slice(1), 10) }]
                : []),
            { user: { fullName: { contains: q, mode: "insensitive" as const } } },
            { user: { phone: { contains: q } } },
          ],
        }
      : {}),
  };

  const [tickets, stats] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { id: true, fullName: true, phone: true, email: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { fullName: true } } },
        },
      },
    }),
    prisma.supportTicket.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  const openCount =
    stats.find((s) => s.status.toUpperCase() === "OPEN")?._count ?? 0;

  return {
    tickets,
    query: q ?? "",
    statusFilter: status ?? "all",
    stats: {
      total: tickets.length,
      open: openCount,
      byStatus: stats.map((s) => ({ status: s.status, count: s._count })),
    },
  };
}

export async function getAdminFormsDashboard(q?: string, status?: string) {
  const where = {
    ...(status && status !== "all" ? { status: status.toUpperCase() as "DRAFT" | "PUBLISHED" | "CLOSED" } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { shortCode: { contains: q, mode: "insensitive" as const } },
            { user: { fullName: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [forms, stats, totalResponses] = await Promise.all([
    prisma.smartForm.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        user: { select: { id: true, fullName: true, phone: true } },
        _count: { select: { responses: true, fields: true } },
      },
    }),
    prisma.smartForm.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.smartFormResponse.count(),
  ]);

  return {
    forms,
    query: q ?? "",
    statusFilter: status ?? "all",
    stats: {
      total: forms.length,
      totalResponses,
      byStatus: stats.map((s) => ({ status: s.status, count: s._count })),
    },
  };
}

export async function getAdminCampaignsDashboard(q?: string, status?: string) {
  const where = {
    ...(status && status !== "all"
      ? { status: status.toUpperCase() as "DRAFT" | "SCHEDULED" | "SENDING" | "COMPLETED" | "CANCELLED" | "PAUSED" }
      : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { user: { fullName: { contains: q, mode: "insensitive" as const } } },
            { user: { phone: { contains: q } } },
          ],
        }
      : {}),
  };

  const [campaigns, stats] = await Promise.all([
    prisma.campaign.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { id: true, fullName: true, phone: true } },
        contactGroup: { select: { name: true } },
      },
    }),
    prisma.campaign.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  const activeCount = stats
    .filter((s) => s.status === "SENDING" || s.status === "SCHEDULED")
    .reduce((n, s) => n + s._count, 0);

  return {
    campaigns,
    query: q ?? "",
    statusFilter: status ?? "all",
    stats: {
      total: campaigns.length,
      active: activeCount,
      byStatus: stats.map((s) => ({ status: s.status, count: s._count })),
    },
  };
}

export async function getAdminMemberProducts(userId: string) {
  const [forms, campaigns, contactCount, groupCount, templateCount, automationCount] =
    await Promise.all([
      prisma.smartForm.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 15,
        include: { _count: { select: { responses: true } } },
      }),
      prisma.campaign.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 15,
        select: {
          id: true,
          name: true,
          status: true,
          recipientCount: true,
          scheduledAt: true,
          createdAt: true,
        },
      }),
      prisma.contact.count({ where: { userId } }),
      prisma.contactGroup.count({ where: { userId } }),
      prisma.smsTemplate.count({ where: { userId } }),
      prisma.automationWorkflow.count({ where: { userId } }),
    ]);

  return {
    forms,
    campaigns,
    contactCount,
    groupCount,
    templateCount,
    automationCount,
  };
}
