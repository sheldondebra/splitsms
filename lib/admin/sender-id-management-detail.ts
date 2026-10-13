import { prisma } from "@/lib/db";
import { getSenderIdUsageStats, type SenderIdUsageStats } from "@/lib/sender-ids/usage-stats";
import { isRestrictionInEffect, type SenderIdManagementState } from "@/lib/sender-ids/management";

export type SenderIdAuditEntry = {
  id: string;
  action: string;
  metadata: unknown;
  createdAt: Date;
  actorName: string | null;
};

export async function getSenderIdManagementDetail(id: string) {
  const sender = await prisma.senderId.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, fullName: true, phone: true, email: true } },
      providerRegistrations: true,
      verificationDocuments: {
        select: { id: true, docType: true, filename: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
      management: true,
    },
  });
  if (!sender) return null;

  const [usage, siblingCopies, auditLogsRaw] = await Promise.all([
    getSenderIdUsageStats(sender.userId, sender.value),
    prisma.senderId.findMany({
      where: { value: sender.value, id: { not: sender.id } },
      select: {
        id: true,
        status: true,
        countryCode: true,
        user: { select: { id: true, fullName: true, phone: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.auditLog.findMany({
      where: { entityType: "SenderId", entityId: id },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { actor: { select: { fullName: true } } },
    }),
  ]);

  const management: SenderIdManagementState = sender.management
    ? {
        status: sender.management.status,
        reason: sender.management.reason,
        suspendedUntil: sender.management.suspendedUntil,
        updatedAt: sender.management.updatedAt,
      }
    : { status: "ACTIVE", reason: null, suspendedUntil: null, updatedAt: null };

  const auditLogs: SenderIdAuditEntry[] = auditLogsRaw.map((row) => ({
    id: row.id,
    action: row.action,
    metadata: row.metadata,
    createdAt: row.createdAt,
    actorName: row.actor?.fullName ?? null,
  }));

  return {
    sender: {
      id: sender.id,
      value: sender.value,
      countryCode: sender.countryCode,
      status: sender.status,
      isDefault: sender.isDefault,
      adminNote: sender.adminNote,
      providerStatus: sender.providerStatus,
      providerSubmittedAt: sender.providerSubmittedAt,
      createdAt: sender.createdAt,
      updatedAt: sender.updatedAt,
      user: sender.user,
      providerRegistrations: sender.providerRegistrations,
      verificationDocuments: sender.verificationDocuments,
    },
    management,
    restricted: isRestrictionInEffect(management),
    usage,
    siblingCopies,
    auditLogs,
  };
}

export type SenderIdManagementDetail = NonNullable<
  Awaited<ReturnType<typeof getSenderIdManagementDetail>>
>;

export type { SenderIdUsageStats };
