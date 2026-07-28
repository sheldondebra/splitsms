import { prisma } from "@/lib/db";
import { loadStripeSettings } from "@/lib/payments/gateway-settings";
import { prepareStripeCharge } from "@/lib/payments/fx-rates";
import { sanitizeWalletReturnPath } from "@/lib/payments/return-path";
import type { PaymentProviderAdapter } from "../types";

const STRIPE_MIN_USD = 0.5;

export const stripeAdapter: PaymentProviderAdapter = {
  method: "STRIPE",
  async initializeTopUp({ paymentId, amount, currency, email, appUrl, returnPath, gatewayOverride }) {
    const config = gatewayOverride ?? (await loadStripeSettings()).config;
    const secret = config.secretKey;
    const { getSiteUrl } = await import("@/lib/site-config");
    const baseUrl = appUrl ?? getSiteUrl();
    const path = sanitizeWalletReturnPath(returnPath);

    if (!config.enabled || !secret) {
      return {
        paymentId,
        instructions: "Stripe is not configured. Add keys in Admin → Payments → Settings.",
      };
    }

    const chargeCurrency = (config.defaultCurrency || "USD").toUpperCase();
    const conversion = await prepareStripeCharge(amount, currency, chargeCurrency);

    if ("error" in conversion) {
      return { paymentId, instructions: conversion.error };
    }

    if (chargeCurrency === "USD" && conversion.chargeAmount < STRIPE_MIN_USD) {
      const minGhs = Math.ceil((STRIPE_MIN_USD / conversion.rate) * 100) / 100;
      return {
        paymentId,
        instructions: `Minimum Stripe top-up is about GHS ${minGhs.toFixed(2)} (USD ${STRIPE_MIN_USD.toFixed(2)}).`,
      };
    }

    const stripeCurrency = conversion.chargeCurrency.toLowerCase();
    const unitAmount = Math.round(conversion.chargeAmount * 100);

    const productName =
      conversion.sourceCurrency === conversion.chargeCurrency
        ? "SplitSMS wallet top-up"
        : `SplitSMS wallet top-up (${conversion.sourceCurrency} ${conversion.sourceAmount.toFixed(2)})`;

    const productDescription =
      conversion.sourceCurrency === conversion.chargeCurrency
        ? undefined
        : `Wallet credit: ${conversion.sourceCurrency} ${conversion.sourceAmount.toFixed(2)} at 1 ${conversion.sourceCurrency} = ${conversion.chargeCurrency} ${conversion.rate.toFixed(6)}`;

    const stripeFxMeta = {
      sourceCurrency: conversion.sourceCurrency,
      sourceAmount: conversion.sourceAmount,
      chargeCurrency: conversion.chargeCurrency,
      chargeAmount: conversion.chargeAmount,
      rate: conversion.rate,
      rateFetchedAt: conversion.rateFetchedAt,
      rateSource: conversion.rateSource,
    };

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        metadata: {
          ...((
            await prisma.payment.findUnique({
              where: { id: paymentId },
              select: { metadata: true },
            })
          )?.metadata as Record<string, unknown> | null),
          stripeFx: stripeFxMeta,
        },
      },
    });

    const body = new URLSearchParams({
      mode: "payment",
      success_url: `${baseUrl}${path}?provider=stripe&reference=${encodeURIComponent(paymentId)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}${path}?error=cancelled`,
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": stripeCurrency,
      "line_items[0][price_data][unit_amount]": String(unitAmount),
      "line_items[0][price_data][product_data][name]": productName,
      client_reference_id: paymentId,
      customer_email: email ?? "member@splitsms.local",
    });

    if (productDescription) {
      body.set("line_items[0][price_data][product_data][description]", productDescription);
    }

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const data = (await res.json()) as { id?: string; url?: string; error?: { message?: string } };

    if (data.id) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          providerReference: data.id,
          metadata: {
            ...((
              await prisma.payment.findUnique({
                where: { id: paymentId },
                select: { metadata: true },
              })
            )?.metadata as Record<string, unknown> | null),
            stripeFx: stripeFxMeta,
            stripeSessionId: data.id,
          },
        },
      });
    }

    if (!data.url) {
      return {
        paymentId,
        instructions: data.error?.message ?? "Could not start Stripe checkout.",
      };
    }

    return { paymentId, redirectUrl: data.url };
  },
};
