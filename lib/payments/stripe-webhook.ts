import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";
import { loadStripeSettings } from "@/lib/payments/gateway-settings";
import { creditWalletFromPayment } from "@/lib/payments/wallet";
import {
  findStripeSessionForPayment,
  reconcilePendingStripePaymentsForUser,
  reconcileStripePayment,
} from "@/lib/payments/admin-payment-insights";

export { reconcilePendingStripePaymentsForUser, reconcileStripePayment, findStripeSessionForPayment };

export function verifyStripeWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
) {
  if (!signatureHeader || !secret) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    }),
  ) as { t?: string; v1?: string };

  if (!parts.t || !parts.v1) return false;

  const payload = `${parts.t}.${rawBody}`;
  const expected = createHmac("sha256", secret).update(payload, "utf8").digest("hex");

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
  } catch {
    return false;
  }
}

export async function handleStripeCheckoutCompleted(paymentId: string) {
  const payment = await prisma.payment.findFirst({
    where: {
      OR: [{ id: paymentId }, { providerReference: paymentId }],
      method: "STRIPE",
    },
  });

  if (!payment || payment.status === "COMPLETED") return;

  await reconcileStripePayment(payment.id);
}
