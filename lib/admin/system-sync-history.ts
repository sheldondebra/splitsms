import { prisma } from "@/lib/db";
import type { AdminSystemSyncTask } from "@/lib/actions/admin-operations";

export type SystemSyncHistoryEntry = {
  id: string;
  createdAt: Date;
  actorName: string;
  ok: boolean;
  tasks: AdminSystemSyncTask[];
  summary: {
    pendingProcessed: number;
    sent: number;
    failed: number;
    remaining: number;
    deliveryRowsUpdated: number;
    scheduledProcessed: number;
    resumedPaused: number;
    providerBalancesChecked: number;
    senderIdsChecked: number;
    senderIdsApproved: number;
    senderIdsPending: number;
  };
};

type SyncMetadata = {
  tasks?: AdminSystemSyncTask[];
  pendingProcessed?: number;
  sent?: number;
  failed?: number;
  remaining?: number;
  deliveryRowsUpdated?: number;
  scheduledProcessed?: number;
  resumedPaused?: number;
  providerBalancesChecked?: number;
  senderIdsChecked?: number;
  senderIdsApproved?: number;
  senderIdsPending?: number;
};

export async function getSystemSyncHistory(limit = 30): Promise<SystemSyncHistoryEntry[]> {
  const logs = await prisma.auditLog.findMany({
    where: { action: "SYSTEM_SYNC_TRIGGERED" },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { actor: { select: { fullName: true, email: true } } },
  });

  return logs.map((log) => {
    const meta = (log.metadata as SyncMetadata | null) ?? {};
    const tasks = meta.tasks ?? [];
    return {
      id: log.id,
      createdAt: log.createdAt,
      actorName: log.actor?.fullName?.trim() || log.actor?.email || "Unknown",
      ok: tasks.every((task) => task.ok),
      tasks,
      summary: {
        pendingProcessed: meta.pendingProcessed ?? 0,
        sent: meta.sent ?? 0,
        failed: meta.failed ?? 0,
        remaining: meta.remaining ?? 0,
        deliveryRowsUpdated: meta.deliveryRowsUpdated ?? 0,
        scheduledProcessed: meta.scheduledProcessed ?? 0,
        resumedPaused: meta.resumedPaused ?? 0,
        providerBalancesChecked: meta.providerBalancesChecked ?? 0,
        senderIdsChecked: meta.senderIdsChecked ?? 0,
        senderIdsApproved: meta.senderIdsApproved ?? 0,
        senderIdsPending: meta.senderIdsPending ?? 0,
      },
    };
  });
}
