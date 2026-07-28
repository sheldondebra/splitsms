import { loadStripeSettings } from "@/lib/payments/gateway-settings";
import { resolveGatewayForPayment } from "@/lib/payments/reseller-checkout";
import { prisma } from "@/lib/db";
import type { PaymentMethod } from "@/lib/generated/prisma/client";

async function stripeSecretForSession(sessionId: string) {
  const payment = await prisma.payment.findFirst({
    where: { OR: [{ providerReference: sessionId }, { id: sessionId }] },
    select: { userId: true, method: true, metadata: true },
  });

  if (payment?.method === "STRIPE") {
    const override = await resolveGatewayForPayment(
      payment.method as PaymentMethod,
      payment.userId,
      payment.metadata,
    );
    if (override?.secretKey) return override.secretKey;
  }

  const { config } = await loadStripeSettings();
  return config.secretKey;
}

export async function verifyStripeCheckoutSession(sessionId: string) {
  const secret = await stripeSecretForSession(sessionId);
  if (!secret) return { ok: false as const, error: "Stripe not configured" };

  const res = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    { headers: { Authorization: `Bearer ${secret}` } },
  );

  const data = (await res.json()) as {
    payment_status?: string;
    client_reference_id?: string;
    error?: { message?: string };
  };

  if (data.payment_status !== "paid") {
    return { ok: false as const, error: data.error?.message ?? "Payment not completed" };
  }

  return { ok: true as const, paymentId: data.client_reference_id };
}
