import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { receiptEmailContent, type ReceiptEmailKind } from "@/lib/email/templates";
import {
  createInvoiceFromPayment,
  createInvoiceFromCreditPurchase,
} from "@/lib/billing/invoices";
import { methodLabel } from "@/lib/payments/admin-payment-insights";
import { formatInstrumentLabel, readPaymentInstrument } from "@/lib/payments/payment-details";
import { sendPlatformAlertSms } from "@/lib/sms/platform-notify";
import { getSiteUrl, siteName } from "@/lib/site-config";
import type { PaymentMethod, TransactionType } from "@/lib/generated/prisma/client";

export type ReceiptChannel = "email" | "sms" | "both";

export type ReceiptSendResult = {
  ok: boolean;
  email?: { ok: boolean; error?: string };
  sms?: { ok: boolean; error?: string };
  error?: string;
};

type ReceiptPayload = {
  kind: ReceiptEmailKind;
  transactionId: string;
  paymentId?: string;
  receiptNo: string;
  memberName: string;
  email?: string | null;
  phone: string;
  amount: number;
  currency: string;
  credits?: number;
  creditsAfter?: number;
  walletBalanceAfter?: number;
  paymentMethod?: string;
  paidWith?: string | null;
  date: Date;
};

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

function formatReceiptDate(date: Date) {
  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function buildReceiptSms(payload: ReceiptPayload): string {
  const name = firstName(payload.memberName);
  const amount = `${payload.currency} ${payload.amount.toFixed(2)}`;

  if (payload.kind === "wallet_topup") {
    return `Hi ${name}, ${amount} added to your wallet. Ref ${payload.receiptNo}. — ${siteName}`;
  }

  const credits = payload.credits?.toLocaleString() ?? "0";
  return `Hi ${name}, ${credits} SMS credits purchased for ${amount}. Ref ${payload.receiptNo}. — ${siteName}`;
}

async function ensureInvoiceForTransaction(transactionId: string) {
  const existing = await prisma.invoice.findFirst({ where: { transactionId } });
  if (existing) return existing;

  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { payment: true },
  });
  if (!tx) return null;

  if (tx.type === "WALLET_TOPUP" && tx.paymentId) {
    const byPayment = await prisma.invoice.findFirst({ where: { paymentId: tx.paymentId } });
    if (byPayment) return byPayment;
    return createInvoiceFromPayment(tx.paymentId);
  }

  if (tx.type === "CREDIT_PURCHASE") {
    return createInvoiceFromCreditPurchase(transactionId);
  }

  return null;
}

async function buildReceiptPayload(transactionId: string): Promise<ReceiptPayload | null> {
  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      user: true,
      payment: true,
    },
  });

  if (!tx || !["WALLET_TOPUP", "CREDIT_PURCHASE"].includes(tx.type)) {
    return null;
  }

  const invoice = await ensureInvoiceForTransaction(transactionId);
  const receiptNo = invoice?.invoiceNo ?? tx.reference ?? tx.id.slice(0, 8).toUpperCase();

  const meta = (tx.metadata ?? {}) as { creditsAfter?: number };
  const kind: ReceiptEmailKind =
    tx.type === "WALLET_TOPUP" ? "wallet_topup" : "credit_purchase";

  let paidWith: string | null = null;
  let paymentMethod: string | undefined;

  if (tx.payment) {
    paymentMethod = methodLabel(tx.payment.method as PaymentMethod);
    paidWith = formatInstrumentLabel(readPaymentInstrument(tx.payment.metadata));
  }

  const walletBalanceAfter =
    tx.balanceAfter != null ? tx.balanceAfter.toNumber() : undefined;

  const credit = await prisma.smsCredit.findUnique({ where: { userId: tx.userId } });
  const creditsAfter =
    kind === "credit_purchase"
      ? (meta.creditsAfter ?? credit?.balance)
      : credit?.balance;

  return {
    kind,
    transactionId: tx.id,
    paymentId: tx.paymentId ?? undefined,
    receiptNo,
    memberName: tx.user.fullName,
    email: tx.user.email,
    phone: tx.user.phone,
    amount: tx.amount.toNumber(),
    currency: tx.currency,
    credits: tx.credits ?? undefined,
    creditsAfter: creditsAfter ?? undefined,
    walletBalanceAfter,
    paymentMethod,
    paidWith,
    date: tx.createdAt,
  };
}

async function recordReceiptDelivery(
  transactionId: string,
  channel: ReceiptChannel,
  result: ReceiptSendResult,
) {
  const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!tx) return;

  const prev = (tx.metadata ?? {}) as Record<string, unknown>;
  const now = new Date().toISOString();

  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      metadata: {
        ...prev,
        receiptLastSentAt: now,
        receiptEmailAt: result.email?.ok ? now : prev.receiptEmailAt,
        receiptSmsAt: result.sms?.ok ? now : prev.receiptSmsAt,
        receiptLastChannel: channel,
      } as object,
    },
  });
}

export async function sendReceipt(
  transactionId: string,
  channel: ReceiptChannel = "both",
): Promise<ReceiptSendResult> {
  const payload = await buildReceiptPayload(transactionId);
  if (!payload) {
    return { ok: false, error: "Receipt not available for this transaction" };
  }

  const result: ReceiptSendResult = { ok: false };
  const tasks: Promise<void>[] = [];

  if (channel === "email" || channel === "both") {
    tasks.push(
      (async () => {
        if (!payload.email) {
          result.email = { ok: false, error: "Member has no email on file" };
          return;
        }

        const { subject, text, html } = await receiptEmailContent({
          kind: payload.kind,
          memberName: payload.memberName,
          receiptNo: payload.receiptNo,
          amount: payload.amount,
          currency: payload.currency,
          date: formatReceiptDate(payload.date),
          credits: payload.credits,
          creditsAfter: payload.creditsAfter,
          walletBalanceAfter: payload.walletBalanceAfter,
          paymentMethod: payload.paymentMethod,
          paidWith: payload.paidWith,
          invoicesUrl: `${getSiteUrl()}/dashboard/invoices`,
        });

        const sent = await sendEmail({
          to: payload.email,
          toName: payload.memberName,
          subject,
          text,
          html,
        });

        if (!sent.ok && process.env.NODE_ENV === "development") {
          console.log(`[DEV RECEIPT EMAIL] ${payload.email}: ${subject}`);
          result.email = { ok: true };
          return;
        }

        result.email = sent.ok ? { ok: true } : { ok: false, error: sent.error };
      })(),
    );
  }

  if (channel === "sms" || channel === "both") {
    tasks.push(
      (async () => {
        const message = buildReceiptSms(payload);
        const sent = await sendPlatformAlertSms(payload.phone, message);

        if (!sent.ok && process.env.NODE_ENV === "development") {
          console.log(`[DEV RECEIPT SMS] ${payload.phone}: ${message}`);
          result.sms = { ok: true };
          return;
        }

        result.sms = sent.ok ? { ok: true } : { ok: false, error: sent.error };
      })(),
    );
  }

  await Promise.all(tasks);

  const emailOk = channel === "sms" || result.email?.ok;
  const smsOk = channel === "email" || result.sms?.ok;
  result.ok = Boolean(emailOk && smsOk);

  if (result.email?.ok || result.sms?.ok) {
    await recordReceiptDelivery(transactionId, channel, result);
  }

  if (!result.ok) {
    const errors = [result.email?.error, result.sms?.error].filter(Boolean);
    result.error = errors.join("; ") || "Receipt delivery failed";
  }

  return result;
}

export async function sendReceiptForPayment(
  paymentId: string,
  channel: ReceiptChannel = "both",
) {
  const tx = await prisma.transaction.findFirst({
    where: { paymentId, type: "WALLET_TOPUP" satisfies TransactionType },
    orderBy: { createdAt: "desc" },
  });

  if (!tx) {
    return { ok: false as const, error: "No wallet transaction found for this payment" };
  }

  return sendReceipt(tx.id, channel);
}

export async function sendReceiptAfterWalletTopUp(paymentId: string) {
  return sendReceiptForPayment(paymentId, "both");
}

export async function sendReceiptAfterCreditPurchase(transactionId: string) {
  return sendReceipt(transactionId, "both");
}
