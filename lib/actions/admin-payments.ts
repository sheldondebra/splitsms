"use server";

import { getSession, isAdminRole } from "@/lib/auth/session";
import { reconcileAllPendingOnlinePayments, reconcileStripePayment } from "@/lib/payments/admin-payment-insights";
import {
  creditProviderPayment,
  fetchProviderTransactionDetails,
} from "@/lib/payments/provider-transaction-details";
import { sendReceiptForPayment, type ReceiptChannel } from "@/lib/billing/receipts";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function syncPendingPaymentsAction() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");

  const result = await reconcileAllPendingOnlinePayments();
  revalidatePath("/admin/payments");
  redirect(`/admin/payments?synced=${result.credited}&checked=${result.checked}&tab=pending`);
}

export async function creditStripePaymentAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");

  const paymentId = String(formData.get("paymentId") ?? "");
  const result = await reconcileStripePayment(paymentId);
  revalidatePath("/admin/payments");

  if (result.ok) {
    redirect("/admin/payments?saved=credited&tab=action");
  }
  redirect("/admin/payments?error=not_paid&tab=action");
}

export async function fetchProviderTransactionDetailsAction(paymentId: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return { ok: false as const, error: "Unauthorized" };
  }
  if (!paymentId) return { ok: false as const, error: "Missing payment id" };
  return fetchProviderTransactionDetails(paymentId);
}

export async function creditProviderPaymentAction(paymentId: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return { ok: false as const, error: "Unauthorized" };
  }
  if (!paymentId) return { ok: false as const, error: "Missing payment id" };

  const result = await creditProviderPayment(paymentId);
  if (result.ok) {
    revalidatePath("/admin/payments");
    revalidatePath("/admin/payments/transactions");
  }
  return result;
}

export async function resendReceiptAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");

  const paymentId = String(formData.get("paymentId") ?? "");
  const channel = String(formData.get("channel") ?? "both") as ReceiptChannel;

  if (!paymentId) redirect("/admin/payments?error=receipt");

  const result = await sendReceiptForPayment(paymentId, channel);
  revalidatePath("/admin/payments");

  if (result.ok) {
    redirect(`/admin/payments?receipt=sent&channel=${encodeURIComponent(channel)}&tab=completed`);
  }

  redirect(`/admin/payments?error=receipt&msg=${encodeURIComponent(result.error ?? "Failed")}&tab=completed`);
}
