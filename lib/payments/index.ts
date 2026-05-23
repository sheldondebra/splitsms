import { PaymentMethod } from "@/lib/generated/prisma/client";
import { paystackAdapter } from "./providers/paystack";
import { manualAdapter } from "./providers/manual";
import type { PaymentProviderAdapter } from "./types";

const adapters: Partial<Record<PaymentMethod, PaymentProviderAdapter>> = {
  PAYSTACK: paystackAdapter,
  MANUAL: manualAdapter,
  FLUTTERWAVE: {
    method: "FLUTTERWAVE",
    async initializeTopUp({ paymentId, amount, currency }) {
      const { getSiteUrl } = await import("@/lib/site-config");
      const appUrl = getSiteUrl();
      if (!process.env.FLUTTERWAVE_SECRET_KEY) {
        return { paymentId, instructions: "Flutterwave not configured." };
      }
      return {
        paymentId,
        redirectUrl: `${appUrl}/dashboard/wallet?flutterwave=${paymentId}&amount=${amount}&currency=${currency}`,
        instructions: "Complete payment via Flutterwave (integrate inline SDK in production).",
      };
    },
  },
  STRIPE: {
    method: "STRIPE",
    async initializeTopUp({ paymentId }) {
      if (!process.env.STRIPE_SECRET_KEY) {
        return { paymentId, instructions: "Stripe not configured." };
      }
      return {
        paymentId,
        instructions: "Stripe Checkout integration — configure STRIPE_SECRET_KEY.",
      };
    },
  },
  MTN_MOMO: {
    method: "MTN_MOMO",
    async initializeTopUp({ paymentId, amount, currency }) {
      if (!process.env.MTN_MOMO_SUBSCRIPTION_KEY) {
        return { paymentId, instructions: "MTN MoMo not configured." };
      }
      return {
        paymentId,
        instructions: `Approve MTN MoMo payment of ${amount} ${currency} on your phone.`,
      };
    },
  },
};

export function getPaymentAdapter(method: PaymentMethod) {
  const adapter = adapters[method];
  if (!adapter) throw new Error(`Unsupported payment method: ${method}`);
  return adapter;
}
