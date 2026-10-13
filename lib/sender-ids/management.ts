import { prisma } from "@/lib/db";
import type { SenderIdOperationalStatus } from "@/lib/generated/prisma/client";
import type { SenderIdRestriction } from "@/lib/sender-ids/suspension";

export {
  describeRestriction,
  isRestrictionInEffect,
  resolveSuspensionDuration,
  SUSPENSION_DURATION_OPTIONS,
  type SenderIdRestriction,
} from "@/lib/sender-ids/suspension";

export type SenderIdManagementState = SenderIdRestriction & {
  updatedAt: Date | null;
};

const DEFAULT_STATE: SenderIdManagementState = {
  status: "ACTIVE",
  reason: null,
  suspendedUntil: null,
  updatedAt: null,
};

export async function loadSenderIdManagementState(
  senderId: string,
): Promise<SenderIdManagementState> {
  const row = await prisma.senderIdManagement.findUnique({ where: { senderId } });
  if (!row) return DEFAULT_STATE;
  return {
    status: row.status,
    reason: row.reason,
    suspendedUntil: row.suspendedUntil,
    updatedAt: row.updatedAt,
  };
}

export async function setSenderIdRestriction(
  senderId: string,
  input: {
    status: SenderIdOperationalStatus;
    reason?: string | null;
    suspendedUntil?: Date | null;
  },
  actorId?: string,
) {
  return prisma.senderIdManagement.upsert({
    where: { senderId },
    update: {
      status: input.status,
      reason: input.reason ?? null,
      suspendedUntil: input.status === "SUSPENDED" ? input.suspendedUntil ?? null : null,
      updatedById: actorId ?? null,
    },
    create: {
      senderId,
      status: input.status,
      reason: input.reason ?? null,
      suspendedUntil: input.status === "SUSPENDED" ? input.suspendedUntil ?? null : null,
      updatedById: actorId ?? null,
    },
  });
}
