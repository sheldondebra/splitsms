"use server";

import { getRealSession as getSession, isSuperAdmin } from "@/lib/auth/session";
import { getRefundEligibility, issueRefund } from "@/lib/payments/refund";
import { revalidatePath } from "next/cache";

async function requireSuperAdmin() {
  const session = await getSession();
  if (!session || !isSuperAdmin(session.role)) {
    return null;
  }
  return session;
}

export async function fetchRefundEligibilityAction(paymentId: string) {
  const session = await requireSuperAdmin();
  if (!session) return { ok: false as const, error: "Unauthorized" };
  if (!paymentId) return { ok: false as const, error: "Missing payment id" };
  return getRefundEligibility(paymentId);
}

export async function issueRefundAction(input: { paymentId: string; amount: number; reason?: string }) {
  const session = await requireSuperAdmin();
  if (!session) return { ok: false as const, error: "Unauthorized — only Super Admins can issue refunds" };
  if (!input.paymentId) return { ok: false as const, error: "Missing payment id" };

  const result = await issueRefund({
    paymentId: input.paymentId,
    amount: input.amount,
    reason: input.reason,
    adminId: session.userId,
  });

  if (result.ok) {
    revalidatePath("/admin/payments");
    revalidatePath("/admin/payments/transactions");
  }

  return result;
}
