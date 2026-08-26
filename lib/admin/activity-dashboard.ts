import { prisma } from "@/lib/db";
import type { AdminActivityDashboard, SerializedActivityLog } from "@/lib/admin/activity-types";
import { ACTIVITY_PAGE_SIZE, parseActivityPage } from "@/lib/admin/activity-list-url";
import {
  accountIdMapFromUsers,
  collectPossibleUserIds,
} from "@/lib/admin/activity-display";
import { formatAccountNumber } from "@/lib/auth/account-number";

export type { AdminActivityDashboard, SerializedActivityLog } from "@/lib/admin/activity-types";
export { activityActionIcon } from "@/lib/admin/activity-types";

function serializeLog(
  log: {
    id: string;
    action: string;
    entityType: string | null;
    entityId: string | null;
    metadata: unknown;
    createdAt: Date;
    actor: { id: string; fullName: string; phone: string; role: string; accountNumber: number | null } | null;
  },
  accountIds: Record<string, string>,
): SerializedActivityLog {
  return {
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    metadata: log.metadata,
    createdAt: log.createdAt.toISOString(),
    actor: log.actor
      ? {
          id: log.actor.id,
          fullName: log.actor.fullName,
          phone: log.actor.phone,
          role: log.actor.role,
          accountId:
            accountIds[log.actor.id] ??
            (log.actor.accountNumber != null
              ? formatAccountNumber(log.actor.accountNumber)
              : null),
        }
      : null,
  };
}

export async function getAdminActivityDashboard(input?: {
  q?: string;
  action?: string;
  page?: string | number;
  pageSize?: number;
}): Promise<AdminActivityDashboard> {
  const q = input?.q?.trim();
  const action = input?.action?.trim();
  const pageSize = Math.min(100, Math.max(10, input?.pageSize ?? ACTIVITY_PAGE_SIZE));
  let page = parseActivityPage(input?.page);

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const searchOr = q
    ? [
        { action: { contains: q, mode: "insensitive" as const } },
        { entityType: { contains: q, mode: "insensitive" as const } },
        { entityId: { contains: q, mode: "insensitive" as const } },
        { actor: { fullName: { contains: q, mode: "insensitive" as const } } },
        { actor: { phone: { contains: q, mode: "insensitive" as const } } },
        ...(/^\d{6}$/.test(q) ? [{ actor: { accountNumber: Number(q) } }] : []),
      ]
    : null;

  const where = {
    ...(action ? { action } : {}),
    ...(searchOr ? { OR: searchOr } : {}),
  };

  const [total, last24h, staffActions, authEvents, distinctActions] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.count({ where: { ...where, createdAt: { gte: since24h } } }),
    prisma.auditLog.count({
      where: { ...where, entityType: { in: ["Staff", "StaffUser"] } },
    }),
    prisma.auditLog.count({
      where: { ...where, entityType: "Auth" },
    }),
    prisma.auditLog.findMany({
      distinct: ["action"],
      select: { action: true },
      orderBy: { action: "asc" },
      take: 80,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (page > totalPages) page = totalPages;

  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      actor: { select: { id: true, fullName: true, phone: true, role: true, accountNumber: true } },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const candidateIds = collectPossibleUserIds(logs);
  const users =
    candidateIds.length === 0
      ? []
      : await prisma.user.findMany({
          where: { id: { in: candidateIds } },
          select: { id: true, accountNumber: true },
        });
  const accountIds = accountIdMapFromUsers(users);

  return {
    stats: {
      total,
      last24h,
      staffActions,
      authEvents,
    },
    logs: logs.map((log) => serializeLog(log, accountIds)),
    actionOptions: distinctActions.map((row) => row.action).filter(Boolean),
    accountIds,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
}
