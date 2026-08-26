import { prisma } from "@/lib/db";
import { verifyPaystackPayment } from "@/lib/payments/paystack-verify";
import { verifyFlutterwavePayment } from "@/lib/payments/flutterwave-verify";
import { verifyStripeCheckoutSession } from "@/lib/payments/stripe-verify";
import { creditWalletFromPayment } from "@/lib/payments/wallet";
import { convertTopUpToCredits, readTopUpCreditMeta } from "@/lib/payments/topup-credits";
import { firstSearchParam } from "@/lib/payments/return-path";
import type { PaymentMethod } from "@/lib/generated/prisma/client";

export async function verifyAndCreditPaymentForUser(params: {
  userId: string;
  method?: string | string[] | null;
  reference?: string | string[] | null;
  stripeSessionId?: string | string[] | null;
}) {
  const method = (firstSearchParam(params.method) ?? "").toUpperCase();
  const reference = firstSearchParam(params.reference) ?? "";
  const sessionId = firstSearchParam(params.stripeSessionId) ?? "";
  if (!reference) return { ok: false as const, error: "Missing payment reference" };

  let payment = await prisma.payment.findFirst({
    where: {
      userId: params.userId,
      OR: [{ id: reference }, { providerReference: reference }],
    },
  });

  if (!payment && method === "STRIPE" && sessionId) {
    const stripe = await verifyStripeCheckoutSession(sessionId);
    if (!stripe.ok) return { ok: false as const, error: stripe.error };
    payment = await prisma.payment.findFirst({
      where: { userId: params.userId, id: stripe.paymentId ?? reference },
    });
  }

  if (!payment) return { ok: false as const, error: "Payment not found" };
  if (payment.status === "COMPLETED") {
    const converted = await convertTopUpToCredits(payment.id);
    return {
      ok: true as const,
      paymentId: payment.id,
      status: "completed" as const,
      convertedCredits: converted?.credits ?? readTopUpCreditMeta(payment.metadata).creditsConverted ?? 0,
    };
  }

  if (payment.method === ("PAYSTACK" satisfies PaymentMethod)) {
    const verified = await verifyPaystackPayment(reference);
    if (!verified.ok) return { ok: false as const, error: verified.error };
  } else if (payment.method === ("FLUTTERWAVE" satisfies PaymentMethod)) {
    const verified = await verifyFlutterwavePayment(reference);
    if (!verified.ok) return { ok: false as const, error: verified.error };
  } else if (payment.method === ("STRIPE" satisfies PaymentMethod)) {
    if (!sessionId) return { ok: false as const, error: "Missing Stripe session ID" };
    const verified = await verifyStripeCheckoutSession(sessionId);
    if (!verified.ok) return { ok: false as const, error: verified.error };
  }

  await creditWalletFromPayment(payment.id);
  const converted = await convertTopUpToCredits(payment.id);
  return {
    ok: true as const,
    paymentId: payment.id,
    status: "completed" as const,
    convertedCredits: converted?.credits ?? 0,
  };
}
