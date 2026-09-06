import type { Refund, User } from "@/lib/generated/prisma/client";

export type SerializedAdminRefund = {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  provider: Refund["provider"];
  status: Refund["status"];
  reason: string | null;
  failureReason: string | null;
  createdAt: string;
  member: { id: string; fullName: string; email: string | null };
  initiatedByName: string;
};

export function serializeAdminRefund(
  refund: Refund & { user: User; initiatedBy: User },
): SerializedAdminRefund {
  return {
    id: refund.id,
    paymentId: refund.paymentId,
    amount: refund.amount.toNumber(),
    currency: refund.currency,
    provider: refund.provider,
    status: refund.status,
    reason: refund.reason,
    failureReason: refund.failureReason,
    createdAt: refund.createdAt.toISOString(),
    member: { id: refund.user.id, fullName: refund.user.fullName, email: refund.user.email },
    initiatedByName: refund.initiatedBy.fullName,
  };
}
