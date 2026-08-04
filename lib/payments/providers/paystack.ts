import { loadPaystackSettings } from "@/lib/payments/gateway-settings";
import { sanitizeWalletReturnPath, walletCallbackUrl } from "@/lib/payments/return-path";
import type { PaymentProviderAdapter, CheckoutSession } from "../types";

export const paystackAdapter: PaymentProviderAdapter = {
  method: "PAYSTACK",
  async initializeTopUp({ paymentId, amount, currency, email, returnPath, gatewayOverride }) {
    const config = gatewayOverride ?? (await loadPaystackSettings()).config;
    const secret = config.secretKey;
    const { getSiteUrl } = await import("@/lib/site-config");
    const appUrl = getSiteUrl();
    if (!config.enabled || !secret) {
      return {
        paymentId,
        instructions: "Paystack is not configured. Add keys in Admin → Payments → Settings.",
      };
    }

    const path = sanitizeWalletReturnPath(returnPath);
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
        // Paystack appends reference=&trxref= itself — do not pre-set reference
        // or Next.js receives string[] and Prisma throws on the return page.
        callback_url: walletCallbackUrl(appUrl, path, {
          provider: "paystack",
        }),
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
