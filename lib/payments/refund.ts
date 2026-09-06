import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { paymentRefundIssuedEmailContent } from "@/lib/email/templates";
import { fetchProviderTransactionDetails } from "@/lib/payments/provider-transaction-details";
import { resolveGatewayForPayment } from "@/lib/payments/reseller-checkout";
import { loadPaystackSettings, loadStripeSettings } from "@/lib/payments/gateway-settings";
import { getSiteUrl } from "@/lib/site-config";
import type { Payment, RefundStatus } from "@/lib/generated/prisma/client";

const REFUNDABLE_METHODS = ["STRIPE", "PAYSTACK"] as const;
type RefundableMethod = (typeof REFUNDABLE_METHODS)[number];

function isRefundableMethod(method: string): method is RefundableMethod {
  return (REFUNDABLE_METHODS as readonly string[]).includes(method);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export type RefundStep = {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "error" | "skipped";
  detail?: string;
};

export type RefundEligibility = {
  paymentId: string;
  method: RefundableMethod;
  totalAmount: number;
  currency: string;
  refundedAmount: number;
  refundableAmount: number;
  fullyRefunded: boolean;
  refunds: {
    id: string;
    amount: number;
    status: RefundStatus;
    reason: string | null;
    failureReason: string | null;
    createdAt: string;
  }[];
  provider: {
    /** Whether we were able to reach the provider at all just now. */
    checked: boolean;
    paid: boolean;
    status: string | null;
    gatewayResponse: string | null;
    mismatch: boolean;
    /** Set whenever refunding would currently fail — surfaced before the admin confirms. */
    error: string | null;
  };
};

export async function getRefundEligibility(
  paymentId: string,
): Promise<{ ok: true; eligibility: RefundEligibility } | { ok: false; error: string }> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return { ok: false, error: "Payment not found" };
  if (!isRefundableMethod(payment.method)) {
    return { ok: false, error: "Only Stripe and Paystack payments can be refunded here" };
  }
  if (payment.status !== "COMPLETED" && payment.status !== "REFUNDED") {
    return { ok: false, error: "Only completed payments can be refunded" };
  }

  const [refunds, live] = await Promise.all([
    prisma.refund.findMany({ where: { paymentId }, orderBy: { createdAt: "desc" } }),
    fetchProviderTransactionDetails(paymentId),
  ]);

  const refundedAmount = round2(
    refunds.filter((r) => r.status !== "FAILED").reduce((sum, r) => sum + r.amount.toNumber(), 0),
  );
  const totalAmount = payment.amount.toNumber();
  const refundableAmount = Math.max(0, round2(totalAmount - refundedAmount));

  const provider = live.ok
    ? {
        checked: true,
        paid: live.details.providerPaid,
        status: live.details.providerStatus,
        gatewayResponse: live.details.gatewayResponse,
        mismatch: live.details.mismatch,
        error: live.details.providerPaid
          ? null
          : `${payment.method === "STRIPE" ? "Stripe" : "Paystack"} does not currently show this payment as paid (status: ${live.details.providerStatus}).`,
      }
    : {
        checked: false,
        paid: false,
        status: null,
        gatewayResponse: null,
        mismatch: false,
        error: `Could not verify this payment with ${payment.method === "STRIPE" ? "Stripe" : "Paystack"}: ${live.error}`,
      };

  return {
    ok: true,
    eligibility: {
      paymentId,
      method: payment.method,
      totalAmount,
      currency: payment.currency,
      refundedAmount,
      refundableAmount,
      fullyRefunded: refundableAmount <= 0,
      refunds: refunds.map((r) => ({
        id: r.id,
        amount: r.amount.toNumber(),
        status: r.status,
        reason: r.reason,
        failureReason: r.failureReason,
        createdAt: r.createdAt.toISOString(),
      })),
      provider,
    },
  };
}

async function resolveSecretKey(payment: Payment): Promise<string | null> {
  const override = await resolveGatewayForPayment(payment.method, payment.userId, payment.metadata);
  if (override?.secretKey) return override.secretKey;

  if (payment.method === "STRIPE") {
    const { config } = await loadStripeSettings();
    return config.secretKey || null;
  }
  const { config } = await loadPaystackSettings();
  return config.secretKey || null;
}

async function resolveProviderChargeReference(payment: Payment): Promise<
  | { ok: true; reference: string; customerEmail: string | null; customerName: string | null }
  | { ok: false; error: string }
> {
  const details = await fetchProviderTransactionDetails(payment.id);
  if (!details.ok) return { ok: false, error: details.error };
  if (!details.details.providerPaid) {
    return { ok: false, error: "The provider does not show this payment as paid" };
  }
  if (!details.details.providerReference) {
    return { ok: false, error: "Could not resolve a provider charge reference for this payment" };
  }
  return {
    ok: true,
    reference: details.details.providerReference,
    customerEmail: details.details.customerEmail,
    customerName: details.details.customerName,
  };
}

type ProviderRefundResult =
  | { ok: true; providerRefundId?: string; status: RefundStatus; raw: unknown }
  | { ok: false; error: string };

async function callStripeRefund(
  secretKey: string,
  paymentIntentId: string,
  amount: number,
  reason: string | undefined,
): Promise<ProviderRefundResult> {
  const body = new URLSearchParams({
    payment_intent: paymentIntentId,
    amount: String(Math.round(amount * 100)),
  });
  if (reason) body.set("metadata[admin_reason]", reason.slice(0, 480));

  const res = await fetch("https://api.stripe.com/v1/refunds", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = (await res.json()) as { id?: string; status?: string; error?: { message?: string } };
  if (!res.ok || !data.id) {
    return { ok: false, error: data.error?.message ?? "Stripe refund request failed" };
  }

  const status: RefundStatus =
    data.status === "succeeded"
      ? "SUCCEEDED"
      : data.status === "failed"
        ? "FAILED"
        : data.status === "pending"
          ? "PENDING"
          : "PROCESSING";

  return { ok: true, providerRefundId: data.id, status, raw: data };
}

async function callPaystackRefund(
  secretKey: string,
  reference: string,
  amount: number,
  currency: string,
  reason: string | undefined,
): Promise<ProviderRefundResult> {
  const res = await fetch("https://api.paystack.co/refund", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transaction: reference,
      amount: Math.round(amount * 100),
      currency,
      customer_note: reason || undefined,
      merchant_note: reason ? `Admin refund: ${reason}` : "Refund issued by admin",
    }),
  });

  const data = (await res.json()) as {
    status?: boolean;
    message?: string;
    data?: { id?: number | string; status?: string };
  };

  if (!res.ok || data.status === false) {
    return { ok: false, error: data.message ?? "Paystack refund request failed" };
  }

  const providerStatus = data.data?.status ?? "pending";
  const status: RefundStatus =
    providerStatus === "processed"
      ? "SUCCEEDED"
      : providerStatus === "failed"
        ? "FAILED"
        : providerStatus === "processing"
          ? "PROCESSING"
          : "PENDING";

  return {
    ok: true,
    providerRefundId: data.data?.id != null ? String(data.data.id) : undefined,
    status,
    raw: data,
  };
}

async function sendRefundEmail(
  payment: Payment,
  amount: number,
  reason: string | undefined,
  fallbackEmail: string | null,
  fallbackName: string | null,
): Promise<{ ok: true; skipped?: string } | { ok: false; error: string }> {
  if (!isRefundableMethod(payment.method)) return { ok: false, error: "Unsupported provider" };

  const user = await prisma.user.findUnique({ where: { id: payment.userId } });
  const email = user?.email ?? fallbackEmail;
  if (!email) return { ok: true, skipped: "Member has no email on file" };
  const memberName = user?.fullName?.trim() || fallbackName || "there";

  const { subject, text, html } = await paymentRefundIssuedEmailContent({
    memberName,
    amount,
    currency: payment.currency,
    method: payment.method,
    reason,
    walletUrl: `${getSiteUrl()}/dashboard/wallet`,
  });

  const sent = await sendEmail({ to: email, toName: memberName, subject, text, html });
  if (!sent.ok) return { ok: false, error: sent.error ?? "Email delivery failed" };
  return { ok: true };
}

export async function issueRefund(params: {
  paymentId: string;
  amount: number;
  reason?: string;
  adminId: string;
}): Promise<
  | { ok: true; refundId: string; status: RefundStatus; steps: RefundStep[] }
  | { ok: false; error: string; steps: RefundStep[] }
> {
  const { paymentId, reason, adminId } = params;
  const amount = round2(params.amount);
  const steps: RefundStep[] = [];

  function addStep(id: string, label: string): RefundStep {
    const s: RefundStep = { id, label, status: "running" };
    steps.push(s);
    return s;
  }
  function fail(step: RefundStep, error: string) {
    step.status = "error";
    step.detail = error;
    return { ok: false as const, error, steps };
  }

  if (!(amount > 0)) return { ok: false, error: "Refund amount must be greater than zero", steps };

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return { ok: false, error: "Payment not found", steps };
  if (!isRefundableMethod(payment.method)) {
    return { ok: false, error: "Only Stripe and Paystack payments can be refunded here", steps };
  }
  if (payment.status !== "COMPLETED" && payment.status !== "REFUNDED") {
    return { ok: false, error: "Only completed payments can be refunded", steps };
  }

  // Reserve the amount atomically first so two concurrent refund requests can't
  // both pass the "remaining refundable" check before either has posted.
  const reserveStep = addStep("reserve", "Reserving refund amount");
  let refundId = "";
  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.refund.findMany({
        where: { paymentId, status: { not: "FAILED" } },
        select: { amount: true },
      });
      const alreadyRefunded = existing.reduce((sum, r) => sum + r.amount.toNumber(), 0);
      const remaining = round2(payment.amount.toNumber() - alreadyRefunded);
      if (amount > remaining + 0.005) {
        throw new Error(
          `Only ${payment.currency} ${remaining.toFixed(2)} remains refundable on this payment`,
        );
      }
      const created = await tx.refund.create({
        data: {
          paymentId,
          userId: payment.userId,
          amount,
          currency: payment.currency,
          provider: payment.method,
          status: "PENDING",
          reason: reason?.trim() || null,
          initiatedById: adminId,
        },
      });
      refundId = created.id;
    });
  } catch (err) {
    return fail(reserveStep, err instanceof Error ? err.message : "Could not reserve refund");
  }
  reserveStep.status = "done";
  reserveStep.detail = `${payment.currency} ${amount.toFixed(2)} reserved`;

  const verifyStep = addStep(
    "verify",
    `Verifying charge with ${payment.method === "STRIPE" ? "Stripe" : "Paystack"}`,
  );
  const chargeRef = await resolveProviderChargeReference(payment);
  if (!chargeRef.ok) {
    await prisma.refund.update({
      where: { id: refundId },
      data: { status: "FAILED", failureReason: chargeRef.error },
    });
    return fail(verifyStep, chargeRef.error);
  }
  verifyStep.status = "done";
  verifyStep.detail = `Reference ${chargeRef.reference}`;

  const configStep = addStep(
    "config",
    `Loading ${payment.method === "STRIPE" ? "Stripe" : "Paystack"} credentials`,
  );
  const secretKey = await resolveSecretKey(payment);
  if (!secretKey) {
    const error = `${payment.method === "STRIPE" ? "Stripe" : "Paystack"} is not configured`;
    await prisma.refund.update({
      where: { id: refundId },
      data: { status: "FAILED", failureReason: error },
    });
    return fail(configStep, error);
  }
  configStep.status = "done";

  const submitStep = addStep(
    "submit",
    `Submitting refund to ${payment.method === "STRIPE" ? "Stripe" : "Paystack"}`,
  );
  const providerResult =
    payment.method === "STRIPE"
      ? await callStripeRefund(secretKey, chargeRef.reference, amount, reason)
      : await callPaystackRefund(secretKey, chargeRef.reference, amount, payment.currency, reason);

  if (!providerResult.ok) {
    await prisma.refund.update({
      where: { id: refundId },
      data: { status: "FAILED", failureReason: providerResult.error },
    });
    return fail(submitStep, providerResult.error);
  }
  submitStep.status = "done";
  submitStep.detail = `${providerResult.providerRefundId ?? "Refund"} — ${providerResult.status.toLowerCase()}`;

  const walletStep = addStep("wallet", "Updating wallet and transaction records");
  let walletDebited = 0;

  await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId: payment.userId } });
    const before = wallet?.balance.toNumber() ?? 0;
    walletDebited = Math.min(before, amount);
    const after = round2(before - walletDebited);

    if (wallet && walletDebited > 0) {
      await tx.wallet.update({ where: { userId: payment.userId }, data: { balance: after } });
    }

    const txRow = await tx.transaction.create({
      data: {
        userId: payment.userId,
        type: "PAYMENT_REFUND",
        amount,
        currency: payment.currency,
        paymentId,
        description: `Refund issued for ${payment.method} payment`,
        reference: providerResult.providerRefundId ?? chargeRef.reference,
        status: "completed",
        balanceBefore: before,
        balanceAfter: after,
        metadata: { walletDebited, reason: reason?.trim() || null },
      },
    });

    await tx.refund.update({
      where: { id: refundId },
      data: {
        status: providerResult.status,
        providerRefundId: providerResult.providerRefundId,
        walletDebited,
        transactionId: txRow.id,
        metadata: { raw: providerResult.raw as object },
      },
    });

    const nonFailed = await tx.refund.findMany({
      where: { paymentId, status: { not: "FAILED" } },
      select: { amount: true },
    });
    const totalRefunded = nonFailed.reduce((sum, r) => sum + r.amount.toNumber(), 0);
    if (totalRefunded >= payment.amount.toNumber() - 0.005) {
      await tx.payment.update({ where: { id: paymentId }, data: { status: "REFUNDED" } });
    }

    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: "PAYMENT_REFUND_ISSUED",
        entityType: "Payment",
        entityId: paymentId,
        metadata: { amount, method: payment.method, reason: reason?.trim() || null },
      },
    });
  });
  walletStep.status = "done";
  walletStep.detail =
    walletDebited < amount
      ? `${payment.currency} ${walletDebited.toFixed(2)} debited (member's wallet balance was lower than the refund)`
      : `${payment.currency} ${walletDebited.toFixed(2)} debited from wallet`;

  const notifyStep = addStep("notify", "Emailing the member");
  try {
    const emailResult = await sendRefundEmail(
      payment,
      amount,
      reason,
      chargeRef.customerEmail,
      chargeRef.customerName,
    );
    if (emailResult.ok) {
      notifyStep.status = "done";
      if (emailResult.skipped) {
        notifyStep.detail = emailResult.skipped;
      }
    } else {
      notifyStep.status = "error";
      notifyStep.detail = `Refund succeeded, but the email failed: ${emailResult.error}`;
    }
  } catch (err) {
    notifyStep.status = "error";
    notifyStep.detail =
      err instanceof Error ? err.message : "The refund succeeded but the email failed to send";
  }

  return { ok: true, refundId, status: providerResult.status, steps };
}
