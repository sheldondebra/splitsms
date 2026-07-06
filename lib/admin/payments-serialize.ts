import type { Payment, User } from "@/lib/generated/prisma/client";

export type SerializedAdminPaymentUser = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
};

export type SerializedAdminPayment = {
  id: string;
  userId: string;
  method: Payment["method"];
  status: Payment["status"];
  amount: number;
  currency: string;
  providerReference: string | null;
  proofUrl: string | null;
  adminNote: string | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
  user: SerializedAdminPaymentUser;
};

export function serializeAdminPayment(payment: Payment & { user: User }): SerializedAdminPayment {
  return {
    id: payment.id,
    userId: payment.userId,
    method: payment.method,
    status: payment.status,
    amount: payment.amount.toNumber(),
    currency: payment.currency,
    providerReference: payment.providerReference,
    proofUrl: payment.proofUrl,
    adminNote: payment.adminNote,
    metadata: payment.metadata,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
    user: {
      id: payment.user.id,
      fullName: payment.user.fullName,
      phone: payment.user.phone,
      email: payment.user.email,
    },
  };
}
