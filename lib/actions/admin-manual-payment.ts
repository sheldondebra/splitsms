"use server";

import { getRealSession as getSession, isAdminRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  checkMobileMoneyCharge,
  initiateMobileMoneyCharge,
  mobileMoneyNetwork,
  resolveMobileMoneyName,
  submitMobileMoneyOtp,
  submitMobileMoneyPin,
  toLocalGhPhone,
  type MobileMoneyChargeStatus,
} from "@/lib/payments/providers/paystack-mobile-money";
import { creditWalletFromPayment } from "@/lib/payments/wallet";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");
  return session;
}

function revalidateManualPaymentPaths() {
  revalidatePath("/admin/payments");
  revalidatePath("/admin/payments/manual");
}

async function logManualPaymentAction(
  actorId: string,
  action: string,
  paymentId: string,
  metadata?: Prisma.InputJsonValue,
) {
  await prisma.auditLog.create({
    data: { actorId, action, entityType: "Payment", entityId: paymentId, metadata },
  });
}

export type ManualPaymentStepResult =
  | {
      ok: true;
      paymentId: string;
      status: MobileMoneyChargeStatus;
      displayText?: string;
      credited?: boolean;
    }
  | { ok: false; error: string };

export async function resolveManualPaymentNameJsonAction(input: {
  phone: string;
  networkId: string;
}): Promise<{ ok: true; accountName: string } | { ok: false; error: string }> {
  await requireAdmin();
  const result = await resolveMobileMoneyName(input.phone, input.networkId);
  if (!result.ok) return result;
  return { ok: true, accountName: result.accountName };
}

/** After the name is confirmed by the admin: creates the Payment row and starts the charge. */
export async function startManualMobileMoneyChargeJsonAction(input: {
  targetUserId: string;
  phone: string;
  networkId: string;
  amount: number;
  confirmedAccountName: string;
}): Promise<ManualPaymentStepResult> {
  const session = await requireAdmin();

  const network = mobileMoneyNetwork(input.networkId);
  if (!network) return { ok: false, error: "Unknown mobile money network." };
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { ok: false, error: "Enter a valid amount." };
  }

  const target = await prisma.user.findUnique({
    where: { id: input.targetUserId },
    select: { id: true, email: true, fullName: true },
  });
  if (!target) return { ok: false, error: "Member not found." };

  const phone = toLocalGhPhone(input.phone);

  const payment = await prisma.payment.create({
    data: {
      userId: target.id,
      method: "PAYSTACK",
      status: "PENDING",
      amount: input.amount,
      currency: "GHS",
      metadata: {
        channel: "manual_mobile_money",
        network: network.id,
        phone,
        confirmedAccountName: input.confirmedAccountName,
        initiatedById: session.userId,
      },
    },
  });

  await logManualPaymentAction(session.userId, "MANUAL_MOBILE_MONEY_STARTED", payment.id, {
    targetUserId: target.id,
    amount: input.amount,
    network: network.id,
  });

  const charge = await initiateMobileMoneyCharge({
    phone,
    networkId: network.id,
    amountGhs: input.amount,
    email: target.email,
  });

  if (!charge.ok) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    revalidateManualPaymentPaths();
    return { ok: false, error: charge.error };
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { providerReference: charge.reference },
  });

  revalidateManualPaymentPaths();

  if (charge.status === "success") {
    await creditWalletFromPayment(payment.id);
    await logManualPaymentAction(session.userId, "MANUAL_MOBILE_MONEY_CREDITED", payment.id, {
      targetUserId: target.id,
      amount: input.amount,
    });
    revalidateManualPaymentPaths();
    return { ok: true, paymentId: payment.id, status: "success", credited: true };
  }

  if (charge.status === "failed") {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    revalidateManualPaymentPaths();
    return { ok: false, error: charge.displayText || "Charge failed." };
  }

  return {
    ok: true,
    paymentId: payment.id,
    status: charge.status,
    displayText: charge.displayText,
  };
}

async function loadPendingPaymentOrFail(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return { ok: false as const, error: "Payment not found." };
  if (!payment.providerReference) return { ok: false as const, error: "No charge reference on this payment." };
  if (payment.status !== "PENDING") {
    return { ok: false as const, error: `This payment is already ${payment.status.toLowerCase()}.` };
  }
  return { ok: true as const, payment };
}

async function finalizeChargeOutcome(
  actorId: string,
  paymentId: string,
  charge: { ok: true; status: MobileMoneyChargeStatus; displayText?: string } | { ok: false; error: string },
): Promise<ManualPaymentStepResult> {
  if (!charge.ok) {
    revalidateManualPaymentPaths();
    return { ok: false, error: charge.error };
  }

  if (charge.status === "success") {
    await creditWalletFromPayment(paymentId);
    await logManualPaymentAction(actorId, "MANUAL_MOBILE_MONEY_CREDITED", paymentId, {});
    revalidateManualPaymentPaths();
    return { ok: true, paymentId, status: "success", credited: true };
  }

  if (charge.status === "failed") {
    await prisma.payment.update({ where: { id: paymentId }, data: { status: "FAILED" } });
    revalidateManualPaymentPaths();
    return { ok: false, error: charge.displayText || "Charge failed." };
  }

  return { ok: true, paymentId, status: charge.status, displayText: charge.displayText };
}

export async function submitManualPaymentOtpJsonAction(input: {
  paymentId: string;
  otp: string;
}): Promise<ManualPaymentStepResult> {
  const session = await requireAdmin();
  const loaded = await loadPendingPaymentOrFail(input.paymentId);
  if (!loaded.ok) return loaded;

  const charge = await submitMobileMoneyOtp(loaded.payment.providerReference!, input.otp.trim());
  return finalizeChargeOutcome(session.userId, input.paymentId, charge);
}

export async function submitManualPaymentPinJsonAction(input: {
  paymentId: string;
  pin: string;
}): Promise<ManualPaymentStepResult> {
  const session = await requireAdmin();
  const loaded = await loadPendingPaymentOrFail(input.paymentId);
  if (!loaded.ok) return loaded;

  const charge = await submitMobileMoneyPin(loaded.payment.providerReference!, input.pin.trim());
  return finalizeChargeOutcome(session.userId, input.paymentId, charge);
}

export async function pollManualPaymentChargeJsonAction(input: {
  paymentId: string;
}): Promise<ManualPaymentStepResult> {
  const session = await requireAdmin();
  const loaded = await loadPendingPaymentOrFail(input.paymentId);
  if (!loaded.ok) return loaded;

  const charge = await checkMobileMoneyCharge(loaded.payment.providerReference!);
  return finalizeChargeOutcome(session.userId, input.paymentId, charge);
}

export async function cancelManualPaymentJsonAction(input: {
  paymentId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireAdmin();
  const payment = await prisma.payment.findUnique({ where: { id: input.paymentId } });
  if (!payment) return { ok: false, error: "Payment not found." };
  if (payment.status !== "PENDING") return { ok: true };

  await prisma.payment.update({ where: { id: input.paymentId }, data: { status: "CANCELLED" } });
  await logManualPaymentAction(session.userId, "MANUAL_MOBILE_MONEY_CANCELLED", input.paymentId, {});
  revalidateManualPaymentPaths();
  return { ok: true };
}
