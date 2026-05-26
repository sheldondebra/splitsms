import { loadStripeSettings } from "@/lib/payments/gateway-settings";

export async function verifyStripeCheckoutSession(sessionId: string) {
  const { config } = await loadStripeSettings();
  const secret = config.secretKey;
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
