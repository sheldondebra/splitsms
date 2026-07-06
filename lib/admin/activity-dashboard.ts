import { prisma } from "@/lib/db";
import type { AdminActivityDashboard, SerializedActivityLog } from "@/lib/admin/activity-types";

export type { AdminActivityDashboard, SerializedActivityLog } from "@/lib/admin/activity-types";
export { activityActionIcon } from "@/lib/admin/activity-types";

function serializeLog(log: {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: unknown;
  createdAt: Date;
  actor: { id: string; fullName: string; phone: string; role: string } | null;
}): SerializedActivityLog {
  return {
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    metadata: log.metadata,
    createdAt: log.createdAt.toISOString(),
    actor: log.actor,
  };
}

export async function getAdminActivityDashboard(input?: {
  q?: string;
  action?: string;
  limit?: number;
}): Promise<AdminActivityDashboard> {
  const q = input?.q?.trim();
  const action = input?.action?.trim();
  const limit = input?.limit ?? 100;

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const where = {
    ...(action ? { action } : {}),
    ...(q
      ? {
          OR: [
            { action: { contains: q, mode: "insensitive" as const } },
            { entityType: { contains: q, mode: "insensitive" as const } },
            { entityId: { contains: q, mode: "insensitive" as const } },
            { actor: { fullName: { contains: q, mode: "insensitive" as const } } },
            { actor: { phone: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [logs, total, last24h, staffActions, authEvents, distinctActions] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        actor: { select: { id: true, fullName: true, phone: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
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
      take: 50,
    }),
  ]);

  return {
    stats: {
      total,
      last24h,
      staffActions,
      authEvents,
    },
    logs: logs.map(serializeLog),
    actionOptions: distinctActions.map((row) => row.action).filter(Boolean),
  };
}
