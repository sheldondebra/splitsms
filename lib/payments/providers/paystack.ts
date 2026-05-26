import { loadPaystackSettings } from "@/lib/payments/gateway-settings";
import type { PaymentProviderAdapter, CheckoutSession } from "../types";

export const paystackAdapter: PaymentProviderAdapter = {
  method: "PAYSTACK",
  async initializeTopUp({ paymentId, amount, currency, email }) {
    const { config } = await loadPaystackSettings();
    const secret = config.secretKey;
    const { getSiteUrl } = await import("@/lib/site-config");
    const appUrl = getSiteUrl();
    if (!config.enabled || !secret) {
      return {
        paymentId,
        instructions: "Paystack is not configured. Add keys in Admin → Payments → Settings.",
      };
    }

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        email: email ?? "member@splitsms.local",
        currency,
        reference: paymentId,
        callback_url: `${appUrl}/dashboard/wallet?provider=paystack&reference=${paymentId}`,
      }),
    });

    const data = (await res.json()) as {
      status?: boolean;
      data?: { authorization_url?: string };
    };

    return {
      paymentId,
      redirectUrl: data.data?.authorization_url,
    } satisfies CheckoutSession;
  },
};
