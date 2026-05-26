import { PaymentMethod } from "@/lib/generated/prisma/client";
import { paystackAdapter } from "./providers/paystack";
import { manualAdapter } from "./providers/manual";
import { flutterwaveAdapter } from "./providers/flutterwave";
import { stripeAdapter } from "./providers/stripe";
import type { PaymentProviderAdapter } from "./types";

const adapters: Partial<Record<PaymentMethod, PaymentProviderAdapter>> = {
  PAYSTACK: paystackAdapter,
  MANUAL: manualAdapter,
  FLUTTERWAVE: flutterwaveAdapter,
  STRIPE: stripeAdapter,
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
