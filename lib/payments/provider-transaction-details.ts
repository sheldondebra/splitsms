import { prisma } from "@/lib/db";
import {
  findStripeSessionForPayment,
  reconcileStripePayment,
} from "@/lib/payments/admin-payment-insights";
import {
  loadPaystackSettings,
  loadStripeSettings,
} from "@/lib/payments/gateway-settings";
import { readPaymentMetadata } from "@/lib/payments/payment-display";
import { verifyPaystackPayment } from "@/lib/payments/paystack-verify";
import { creditWalletFromPayment } from "@/lib/payments/wallet";
import type { Payment, PaymentStatus } from "@/lib/generated/prisma/client";

export type ProviderTransactionDetails = {
  paymentId: string;
  method: "PAYSTACK" | "STRIPE";
  dbStatus: PaymentStatus;
  providerStatus: string;
  providerPaid: boolean;
  mismatch: boolean;
  canCredit: boolean;
  amount: number | null;
  currency: string | null;
  fees: number | null;
  customerEmail: string | null;
  customerName: string | null;
  customerPhone: string | null;
  channel: string | null;
  instrumentSummary: string | null;
  providerReference: string | null;
  gatewayResponse: string | null;
  fetchedAt: string;
  raw: unknown;
};

export type ProviderTransactionDetailsResult =
  | { ok: true; details: ProviderTransactionDetails }
  | { ok: false; error: string };

function paystackReference(payment: Payment) {
  return payment.providerReference?.startsWith("pending-")
    ? payment.id
    : (payment.providerReference ?? payment.id);
}

async function resolveStripeSessionId(payment: Payment) {
  const meta = readPaymentMetadata(payment.metadata);
  const sessionId = meta.stripeSessionId ?? payment.providerReference ?? "";

  if (
    sessionId &&
    sessionId !== payment.id &&
    !sessionId.startsWith("pending-") &&
    sessionId.startsWith("cs_")
  ) {
    return sessionId;
  }

  const found = await findStripeSessionForPayment(payment.id, payment.createdAt);
  return found.ok ? found.sessionId : null;
}

function formatMoneyFromMinor(amount: number | undefined) {
  if (amount == null || !Number.isFinite(amount)) return null;
  return amount / 100;
}

async function fetchPaystackDetails(payment: Payment): Promise<ProviderTransactionDetailsResult> {
  const { config } = await loadPaystackSettings();
  if (!config.secretKey) {
    return { ok: false, error: "Paystack not configured" };
  }

  const reference = paystackReference(payment);
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${config.secretKey}` } },
  );

  const body = (await res.json()) as {
    status?: boolean;
    message?: string;
    data?: {
      status?: string;
      amount?: number;
      currency?: string;
      fees?: number;
      channel?: string;
      gateway_response?: string;
      reference?: string;
      customer?: {
        email?: string;
        phone?: string;
        first_name?: string;
        last_name?: string;
      };
      authorization?: {
        brand?: string;
        card_type?: string;
        last4?: string;
        bank?: string;
        channel?: string;
        mobile_money_number?: string;
        account_name?: string;
      };
    };
  };

  if (!res.ok || body.status === false) {
    return { ok: false, error: body.message ?? "Paystack verify failed" };
  }

  const data = body.data;
  if (!data) {
    return { ok: false, error: body.message ?? "No Paystack transaction data" };
  }

  const providerStatus = data.status ?? "unknown";
  const providerPaid = providerStatus === "success";
  const auth = data.authorization;
  const customerName =
    [data.customer?.first_name, data.customer?.last_name].filter(Boolean).join(" ") ||
    auth?.account_name ||
    null;

  let instrumentSummary: string | null = null;
  if (auth?.brand && auth.last4) {
    instrumentSummary = `${auth.brand} ···· ${auth.last4}`;
  } else if (data.channel === "mobile_money" || auth?.mobile_money_number) {
    instrumentSummary = `MoMo ···· ${auth?.last4 ?? auth?.mobile_money_number?.slice(-4) ?? "****"}`;
  } else if (data.channel) {
    instrumentSummary = data.channel.replace(/_/g, " ");
  }

  const details: ProviderTransactionDetails = {
    paymentId: payment.id,
    method: "PAYSTACK",
    dbStatus: payment.status,
    providerStatus,
    providerPaid,
    mismatch: providerPaid !== (payment.status === "COMPLETED"),
    canCredit: providerPaid && payment.status === "PENDING",
    amount: formatMoneyFromMinor(data.amount),
    currency: data.currency ?? payment.currency,
    fees: formatMoneyFromMinor(data.fees),
    customerEmail: data.customer?.email ?? null,
    customerName,
    customerPhone: data.customer?.phone ?? auth?.mobile_money_number ?? null,
    channel: data.channel ?? auth?.channel ?? null,
    instrumentSummary,
    providerReference: data.reference ?? reference,
    gatewayResponse: data.gateway_response ?? null,
    fetchedAt: new Date().toISOString(),
    raw: body,
  };

  return { ok: true, details };
}

async function fetchStripeDetails(payment: Payment): Promise<ProviderTransactionDetailsResult> {
  const { config } = await loadStripeSettings();
  if (!config.secretKey) {
    return { ok: false, error: "Stripe not configured" };
  }

  const sessionId = await resolveStripeSessionId(payment);
  if (!sessionId) {
    return { ok: false, error: "No Stripe checkout session found" };
  }

  const url = new URL(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
  );
  url.searchParams.append("expand[]", "payment_intent");
  url.searchParams.append("expand[]", "payment_intent.payment_method");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${config.secretKey}` },
  });

  const data = (await res.json()) as {
    id?: string;
    status?: string;
    payment_status?: string;
    amount_total?: number;
    currency?: string;
    total_details?: { amount_tax?: number };
    customer_details?: { email?: string; name?: string; phone?: string };
    payment_intent?: {
      id?: string;
      status?: string;
      amount?: number;
      currency?: string;
      application_fee_amount?: number | null;
      payment_method?: {
        type?: string;
        card?: {
          brand?: string;
          last4?: string;
          funding?: string;
          country?: string;
        };
        mobile_money?: { phone?: string; carrier?: string };
      };
    };
    error?: { message?: string };
  };

  if (!res.ok || data.error) {
    return { ok: false, error: data.error?.message ?? "Stripe session fetch failed" };
  }

  const providerStatus = data.payment_status ?? data.status ?? "unknown";
  const providerPaid = providerStatus === "paid";
  const pm = data.payment_intent?.payment_method;

  let instrumentSummary: string | null = null;
  let channel: string | null = pm?.type ?? null;
  if (pm?.type === "card" && pm.card) {
    channel = "card";
    instrumentSummary = `${pm.card.brand ?? "Card"} ···· ${pm.card.last4 ?? "****"}`;
  } else if (pm?.type === "mobile_money" && pm.mobile_money) {
    channel = "mobile_money";
    instrumentSummary = `${pm.mobile_money.carrier ?? "MoMo"} ${pm.mobile_money.phone ?? ""}`.trim();
  } else if (pm?.type) {
    instrumentSummary = pm.type.replace(/_/g, " ");
  }

  const amountMinor = data.amount_total ?? data.payment_intent?.amount;
  const currency = (data.currency ?? data.payment_intent?.currency ?? payment.currency)?.toUpperCase();
  const feesMinor = data.payment_intent?.application_fee_amount ?? null;

  const details: ProviderTransactionDetails = {
    paymentId: payment.id,
    method: "STRIPE",
    dbStatus: payment.status,
    providerStatus,
    providerPaid,
    mismatch: providerPaid !== (payment.status === "COMPLETED"),
    canCredit: providerPaid && payment.status === "PENDING",
    amount: formatMoneyFromMinor(amountMinor),
    currency: currency ?? null,
    fees: feesMinor != null ? formatMoneyFromMinor(feesMinor) : null,
    customerEmail: data.customer_details?.email ?? null,
    customerName: data.customer_details?.name ?? null,
    customerPhone: data.customer_details?.phone ?? null,
    channel,
    instrumentSummary,
    providerReference: data.payment_intent?.id ?? sessionId,
    gatewayResponse: data.payment_intent?.status ?? null,
    fetchedAt: new Date().toISOString(),
    raw: data,
  };

  return { ok: true, details };
}

export async function fetchProviderTransactionDetails(
  paymentId: string,
): Promise<ProviderTransactionDetailsResult> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return { ok: false, error: "Payment not found" };

  if (payment.method === "PAYSTACK") return fetchPaystackDetails(payment);
  if (payment.method === "STRIPE") return fetchStripeDetails(payment);

  return { ok: false, error: "Only Paystack and Stripe payments are supported" };
}

export async function creditProviderPayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return { ok: false as const, error: "Payment not found" };
  if (payment.status !== "PENDING") {
    return { ok: false as const, error: "Payment is not pending" };
  }

  if (payment.method === "STRIPE") {
    const result = await reconcileStripePayment(paymentId);
    if (result.ok) return { ok: true as const, result: "credited" as const };
    return { ok: false as const, error: "Provider has not marked this payment as paid" };
  }

  if (payment.method === "PAYSTACK") {
    const ref = paystackReference(payment);
    const verified = await verifyPaystackPayment(ref);
    if (!verified.ok) {
      return { ok: false as const, error: verified.error ?? "Payment not successful on Paystack" };
    }
    await creditWalletFromPayment(payment.id);
    return { ok: true as const, result: "credited" as const };
  }

  return { ok: false as const, error: "Only Paystack and Stripe payments can be credited here" };
}
