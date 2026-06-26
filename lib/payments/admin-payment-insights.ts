import { prisma } from "@/lib/db";
import { loadStripeSettings } from "@/lib/payments/gateway-settings";
import { verifyStripeCheckoutSession } from "@/lib/payments/stripe-verify";
import { verifyPaystackPayment } from "@/lib/payments/paystack-verify";
import { verifyFlutterwavePayment } from "@/lib/payments/flutterwave-verify";
import { creditWalletFromPayment } from "@/lib/payments/wallet";
import type { Payment, PaymentMethod, PaymentStatus } from "@/lib/generated/prisma/client";

export type PaymentInsight = {
  label: string;
  detail: string;
  tone: "neutral" | "warning" | "success" | "danger";
  providerPaid?: boolean;
  canAutoCredit?: boolean;
};

export async function findStripeSessionForPayment(paymentId: string, createdAfter?: Date) {
  const { config } = await loadStripeSettings();
  const secret = config.secretKey;
  if (!secret) return { ok: false as const, error: "Stripe not configured" };

  const query = `client_reference_id:'${paymentId}'`;
  const searchUrl = new URL("https://api.stripe.com/v1/checkout/sessions/search");
  searchUrl.searchParams.set("query", query);
  searchUrl.searchParams.set("limit", "1");

  const searchRes = await fetch(searchUrl.toString(), {
    headers: { Authorization: `Bearer ${secret}` },
  });

  if (searchRes.ok) {
    const data = (await searchRes.json()) as {
      data?: { id?: string; payment_status?: string; status?: string }[];
    };
    const session = data.data?.[0];
    if (session?.id) {
      return {
        ok: true as const,
        sessionId: session.id,
        paymentStatus: session.payment_status ?? "unknown",
        sessionStatus: session.status ?? "unknown",
      };
    }
  }

  // Search API unavailable on some accounts — scan recent checkout sessions.
  const createdGte = createdAfter
    ? Math.floor(createdAfter.getTime() / 1000) - 3600
    : Math.floor(Date.now() / 1000) - 7 * 24 * 3600;

  let startingAfter: string | undefined;
  for (let page = 0; page < 10; page++) {
    const listUrl = new URL("https://api.stripe.com/v1/checkout/sessions");
    listUrl.searchParams.set("limit", "100");
    listUrl.searchParams.set("created[gte]", String(createdGte));
    if (startingAfter) listUrl.searchParams.set("starting_after", startingAfter);

    const listRes = await fetch(listUrl.toString(), {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const listData = (await listRes.json()) as {
      data?: { id?: string; client_reference_id?: string; payment_status?: string; status?: string }[];
      has_more?: boolean;
      error?: { message?: string };
    };

    if (!listRes.ok) {
      return { ok: false as const, error: listData.error?.message ?? "Stripe list failed" };
    }

    const session = listData.data?.find((s) => s.client_reference_id === paymentId);
    if (session?.id) {
      return {
        ok: true as const,
        sessionId: session.id,
        paymentStatus: session.payment_status ?? "unknown",
        sessionStatus: session.status ?? "unknown",
      };
    }

    if (!listData.has_more || !listData.data?.length) break;
    startingAfter = listData.data[listData.data.length - 1]?.id;
  }

  return { ok: false as const, error: "No Stripe checkout session found" };
}

async function fetchStripeSession(sessionId: string) {
  const { config } = await loadStripeSettings();
  const secret = config.secretKey;
  if (!secret) return null;

  const res = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    { headers: { Authorization: `Bearer ${secret}` } },
  );

  const data = (await res.json()) as {
    payment_status?: string;
    status?: string;
    error?: { message?: string };
  };

  if (data.error) return null;
  return data;
}

export async function getPaymentInsight(payment: Payment): Promise<PaymentInsight> {
  if (payment.status === "COMPLETED") {
    return {
      label: "Completed",
      detail: "Wallet credited — member balance was updated.",
      tone: "success",
    };
  }

  if (payment.status === "CANCELLED") {
    return {
      label: "Cancelled",
      detail: payment.adminNote ?? "Payment was rejected or cancelled.",
      tone: "danger",
    };
  }

  if (payment.status === "FAILED") {
    return {
      label: "Failed",
      detail: payment.adminNote ?? "Provider reported a failed payment.",
      tone: "danger",
    };
  }

  return getPendingPaymentInsight(payment);
}

async function getPendingPaymentInsight(payment: Payment): Promise<PaymentInsight> {
  switch (payment.method) {
    case "MANUAL":
      return {
        label: "Awaiting approval",
        detail:
          "Member submitted an offline bank transfer. Approve after you verify the deposit in your bank account.",
        tone: "warning",
      };

    case "STRIPE":
      return getStripePendingInsight(payment);

    case "PAYSTACK":
      return {
        label: "Pending — Paystack",
        detail:
          "Waiting for Paystack confirmation. Credits when the member returns from checkout or the webhook fires.",
        tone: "neutral",
        canAutoCredit: Boolean(payment.providerReference && !payment.providerReference.startsWith("pending-")),
      };

    case "FLUTTERWAVE":
      return {
        label: "Pending — Flutterwave",
        detail:
          "Waiting for Flutterwave confirmation. Credits when the member completes checkout or the webhook fires.",
        tone: "neutral",
        canAutoCredit: Boolean(payment.providerReference && !payment.providerReference.startsWith("pending-")),
      };

    default:
      return {
        label: "Pending",
        detail: "Payment has not been completed yet.",
        tone: "neutral",
      };
  }
}

async function getStripePendingInsight(payment: Payment): Promise<PaymentInsight> {
  const metadata = payment.metadata as { stripeSessionId?: string } | null;
  let sessionId = metadata?.stripeSessionId ?? payment.providerReference ?? "";

  if (!sessionId || sessionId === payment.id || sessionId.startsWith("pending-")) {
    const found = await findStripeSessionForPayment(payment.id, payment.createdAt);
    if (!found.ok) {
      return {
        label: "Checkout not finished",
        detail:
          "Member opened Stripe checkout but has not paid yet, or the session expired. No charge on Stripe.",
        tone: "neutral",
      };
    }
    sessionId = found.sessionId;
    if (found.paymentStatus === "paid") {
      return {
        label: "Paid in Stripe",
        detail: "Stripe shows payment succeeded. Wallet will be credited automatically.",
        tone: "warning",
        providerPaid: true,
        canAutoCredit: true,
      };
    }
    if (found.sessionStatus === "expired") {
      return {
        label: "Checkout expired",
        detail: "Stripe checkout session expired before payment.",
        tone: "danger",
      };
    }
    return {
      label: "Awaiting payment",
      detail: "Stripe checkout is open — customer has not paid yet.",
      tone: "neutral",
    };
  }

  const session = await fetchStripeSession(sessionId);
  if (!session) {
    return {
      label: "Pending — Stripe",
      detail: "Could not verify session with Stripe. Check API keys in Payment settings.",
      tone: "warning",
    };
  }

  if (session.payment_status === "paid") {
    return {
      label: "Paid in Stripe",
      detail: "Stripe confirms payment. Wallet should credit automatically.",
      tone: "warning",
      providerPaid: true,
      canAutoCredit: true,
    };
  }

  if (session.status === "expired") {
    return {
      label: "Checkout expired",
      detail: "Customer did not complete payment in time.",
      tone: "danger",
    };
  }

  return {
    label: "Awaiting payment",
    detail: "Customer has not completed Stripe checkout yet.",
    tone: "neutral",
  };
}

export async function reconcileStripePayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.method !== "STRIPE" || payment.status !== "PENDING") {
    return { ok: false as const, result: "skipped" as const };
  }

  const metadata = payment.metadata as { stripeSessionId?: string } | null;
  let sessionId = metadata?.stripeSessionId ?? payment.providerReference ?? "";

  if (!sessionId || sessionId === payment.id || sessionId.startsWith("pending-")) {
    const found = await findStripeSessionForPayment(payment.id, payment.createdAt);
    if (!found.ok || found.paymentStatus !== "paid") {
      return { ok: false as const, result: "not_paid" as const };
    }
    sessionId = found.sessionId;
  }

  const verified = await verifyStripeCheckoutSession(sessionId);
  if (!verified.ok) return { ok: false as const, result: "not_paid" as const };

  await creditWalletFromPayment(payment.id);
  return { ok: true as const, result: "credited" as const };
}

export async function reconcilePendingStripePaymentsForUser(userId: string) {
  const pending = await prisma.payment.findMany({
    where: { userId, method: "STRIPE", status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  let credited = 0;
  for (const payment of pending) {
    const result = await reconcileStripePayment(payment.id);
    if (result.ok) credited++;
  }
  return credited;
}

export async function reconcileAllPendingOnlinePayments() {
  const pending = await prisma.payment.findMany({
    where: {
      status: "PENDING",
      method: { in: ["STRIPE", "PAYSTACK", "FLUTTERWAVE"] },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  let credited = 0;
  let checked = pending.length;

  for (const payment of pending) {
    if (payment.method === "STRIPE") {
      const result = await reconcileStripePayment(payment.id);
      if (result.ok) credited++;
      continue;
    }

    const ref = payment.providerReference;
    if (!ref || ref.startsWith("pending-")) continue;

    if (payment.method === "PAYSTACK") {
      const verified = await verifyPaystackPayment(ref);
      if (verified.ok) {
        await creditWalletFromPayment(payment.id);
        credited++;
      }
    } else if (payment.method === "FLUTTERWAVE") {
      const verified = await verifyFlutterwavePayment(ref);
      if (verified.ok) {
        await creditWalletFromPayment(payment.id);
        credited++;
      }
    }
  }

  return { credited, checked };
}

export function statusBadgeVariant(
  status: PaymentStatus,
  insight: PaymentInsight,
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "COMPLETED") return "default";
  if (status === "PENDING" && insight.providerPaid) return "outline";
  if (status === "PENDING") return "secondary";
  return "destructive";
}

export function methodLabel(method: PaymentMethod) {
  const labels: Record<PaymentMethod, string> = {
    PAYSTACK: "Paystack",
    FLUTTERWAVE: "Flutterwave",
    STRIPE: "Stripe",
    MTN_MOMO: "MTN MoMo",
    MANUAL: "Bank transfer",
  };
  return labels[method] ?? method;
}
