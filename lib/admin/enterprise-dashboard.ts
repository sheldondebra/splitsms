import { prisma } from "@/lib/db";
import { subDays } from "date-fns";
import { slaUptimePercent } from "@/lib/enterprise/context";

export type AdminEnterpriseDashboard = Awaited<ReturnType<typeof getAdminEnterpriseDashboard>>;

export async function getAdminEnterpriseDashboard() {
  const since24h = subDays(new Date(), 1);
  const since30d = subDays(new Date(), 30);

  const [
    accounts,
    dedicatedRoutes,
    activeSessions,
    pendingQueue,
    smsLast24h,
    recentSubmits,
    candidateUsers,
    routeAssignCounts,
    smppCredentialSetting,
    smppResetSetting,
  ] = await Promise.all([
    prisma.enterpriseAccount.findMany({
      include: {
        user: { select: { id: true, fullName: true, phone: true, email: true } },
        dedicatedRoute: true,
        smppAccount: {
          include: {
            sessions: { where: { isActive: true }, select: { id: true } },
          },
        },
        credit: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.dedicatedRoute.findMany({
      include: { _count: { select: { enterpriseAccounts: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.smppSession.count({ where: { isActive: true } }),
    prisma.message.count({ where: { status: "PENDING" } }),
    prisma.message.count({
      where: { createdAt: { gte: since24h }, channel: "smpp" },
    }),
    prisma.smppSubmitLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: {
        smppAccount: {
          include: { enterprise: { select: { companyName: true } } },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        role: "MEMBER",
        enterpriseAccount: null,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, fullName: true, phone: true },
    }),
    prisma.enterpriseAccount.groupBy({
      by: ["dedicatedRouteId"],
      _count: { id: true },
      where: { dedicatedRouteId: { not: null } },
    }),
    prisma.platformSetting.findUnique({ where: { key: "enterprise_last_smpp_created" } }),
    prisma.platformSetting.findUnique({ where: { key: "enterprise_last_smpp_reset" } }),
  ]);

  const assignMap = new Map(
    routeAssignCounts.map((r) => [r.dedicatedRouteId!, r._count.id]),
  );

  const accountIds = accounts.map((a) => a.id);
  const userIds = accounts.map((a) => a.userId);

  const [messages30d, smppByEnterprise] = await Promise.all([
    userIds.length
      ? prisma.message.groupBy({
          by: ["userId"],
          where: { userId: { in: userIds }, createdAt: { gte: since30d } },
          _count: { id: true },
        })
      : [],
    accountIds.length
      ? prisma.message.groupBy({
          by: ["userId"],
          where: {
            userId: { in: userIds },
            createdAt: { gte: since24h },
            channel: "smpp",
          },
          _count: { id: true },
        })
      : [],
  ]);

  const msg30Map = new Map(messages30d.map((m) => [m.userId, m._count.id]));
  const smpp24Map = new Map(smppByEnterprise.map((m) => [m.userId, m._count.id]));

  const enterpriseRows = accounts.map((ent) => {
    const binds = ent.smppAccount?.sessions.length ?? 0;
    const isOperational =
      ent.status === "ACTIVE" &&
      Boolean(ent.smppAccount?.isActive) &&
      binds > 0;
    return {
      id: ent.id,
      userId: ent.userId,
      companyName: ent.companyName,
      status: ent.status,
      slaTier: ent.slaTier,
      slaUptime: slaUptimePercent(ent.slaTier),
      throughputPerSec: ent.throughputPerSec,
      apiRateLimit: ent.apiRateLimit,
      user: ent.user,
      smpp: ent.smppAccount
        ? {
            id: ent.smppAccount.id,
            systemId: ent.smppAccount.systemId,
            throughput: ent.smppAccount.throughput,
            isActive: ent.smppAccount.isActive,
            activeBinds: binds,
            isConnected: binds > 0,
          }
        : null,
      credit: ent.credit
        ? {
            used: ent.credit.usedCredit.toNumber(),
            limit: ent.credit.creditLimit.toNumber(),
            currency: ent.credit.currency,
          }
        : null,
      route: ent.dedicatedRoute
        ? {
            id: ent.dedicatedRoute.id,
            name: ent.dedicatedRoute.name,
            countryCode: ent.dedicatedRoute.countryCode,
            lockedProvider: ent.dedicatedRoute.lockedProvider,
            isActive: ent.dedicatedRoute.isActive,
          }
        : null,
      messages30d: msg30Map.get(ent.userId) ?? 0,
      smpp24h: smpp24Map.get(ent.userId) ?? 0,
      isOperational,
    };
  });

  const routeRows = dedicatedRoutes.map((r) => ({
    id: r.id,
    name: r.name,
    countryCode: r.countryCode,
    lockedProvider: r.lockedProvider,
    description: r.description,
    isActive: r.isActive,
    assignedCount: assignMap.get(r.id) ?? r._count.enterpriseAccounts,
    isLive: r.isActive && Boolean(r.countryCode),
  }));

  const pending = accounts.filter((a) => a.status === "PENDING").length;
  const active = accounts.filter((a) => a.status === "ACTIVE").length;
  const suspended = accounts.filter((a) => a.status === "SUSPENDED").length;
  const connected = enterpriseRows.filter((e) => e.isOperational).length;

  const smppPort = process.env.SMPP_PORT ?? "2775";
  const smppHost = process.env.SMPP_PUBLIC_HOST ?? "localhost";

  return {
    stats: {
      total: accounts.length,
      pending,
      active,
      suspended,
      connected,
      activeSessions,
      pendingQueue,
      smsLast24h,
      dedicatedRoutes: routeRows.length,
    },
    enterprises: enterpriseRows,
    dedicatedRoutes: routeRows,
    candidateUsers,
    recentSubmits: recentSubmits.map((s) => ({
      id: s.id,
      companyName: s.smppAccount.enterprise.companyName,
      systemId: s.smppAccount.systemId,
      sourceAddr: s.sourceAddr,
      destAddr: s.destAddr,
      status: s.status,
      errorCode: s.errorCode,
      createdAt: s.createdAt,
    })),
    smppSetup: {
      host: smppHost,
      port: smppPort,
      workerCommand: "npm run worker:smpp",
    },
    credentials: {
      created: smppCredentialSetting?.value as
        | { systemId: string; password: string; companyName: string; at: string }
        | undefined,
      reset: smppResetSetting?.value as
        | { systemId: string; password: string; at: string }
        | undefined,
    },
  };
}
