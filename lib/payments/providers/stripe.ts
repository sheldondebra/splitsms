import { loadStripeSettings } from "@/lib/payments/gateway-settings";
import type { PaymentProviderAdapter } from "../types";

export const stripeAdapter: PaymentProviderAdapter = {
  method: "STRIPE",
  async initializeTopUp({ paymentId, amount, currency, email }) {
    const { config } = await loadStripeSettings();
    const secret = config.secretKey;
    const { getSiteUrl } = await import("@/lib/site-config");
    const appUrl = getSiteUrl();

    if (!config.enabled || !secret) {
      return {
        paymentId,
        instructions: "Stripe is not configured. Add keys in Admin → Payments → Settings.",
      };
    }

    const stripeCurrency = currency.toLowerCase();
    const unitAmount = Math.round(amount * 100);

    const body = new URLSearchParams({
      mode: "payment",
      success_url: `${appUrl}/dashboard/wallet?provider=stripe&reference=${paymentId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/wallet?error=cancelled`,
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": stripeCurrency,
      "line_items[0][price_data][unit_amount]": String(unitAmount),
      "line_items[0][price_data][product_data][name]": "SplitSMS wallet top-up",
      client_reference_id: paymentId,
      customer_email: email ?? "member@splitsms.local",
    });

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const data = (await res.json()) as { url?: string; error?: { message?: string } };

    if (!data.url) {
      return {
        paymentId,
        instructions: data.error?.message ?? "Could not start Stripe checkout.",
      };
    }

    return { paymentId, redirectUrl: data.url };
  },
};
