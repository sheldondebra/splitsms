import { loadFlutterwaveSettings } from "@/lib/payments/gateway-settings";
import type { PaymentProviderAdapter } from "../types";

export const flutterwaveAdapter: PaymentProviderAdapter = {
  method: "FLUTTERWAVE",
  async initializeTopUp({ paymentId, amount, currency, email }) {
    const { config } = await loadFlutterwaveSettings();
    const secret = config.secretKey;
    const { getSiteUrl } = await import("@/lib/site-config");
    const appUrl = getSiteUrl();

    if (!config.enabled || !secret) {
      return {
        paymentId,
        instructions: "Flutterwave is not configured. Add keys in Admin → Payments → Settings.",
      };
    }

    const res = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: paymentId,
        amount,
        currency,
        redirect_url: `${appUrl}/dashboard/wallet?provider=flutterwave&reference=${paymentId}`,
        customer: { email: email ?? "member@splitsms.local" },
        customizations: {
          title: "SplitSMS Wallet",
          description: "Add money to your SMS wallet",
        },
      }),
    });

    const data = (await res.json()) as {
      status?: string;
      data?: { link?: string };
      message?: string;
    };

    if (data.status !== "success" || !data.data?.link) {
      return {
        paymentId,
        instructions: data.message ?? "Could not start Flutterwave checkout.",
      };
    }

    return { paymentId, redirectUrl: data.data.link };
  },
};
