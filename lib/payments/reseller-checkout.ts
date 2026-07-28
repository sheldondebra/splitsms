import { prisma } from "@/lib/db";
import type { PaymentMethod } from "@/lib/generated/prisma/client";
import type { GatewayConfig } from "@/lib/payments/gateway-settings";
import { getOrCreateResellerPaymentSettings } from "@/lib/reseller/payment-settings";

export type ResellerCheckoutContext = {
  mode: "PLATFORM" | "OWN";
  resellerId: string | null;
  paystack: GatewayConfig | null;
  stripe: GatewayConfig | null;
};

export type PaymentCheckoutMeta = {
  checkoutOwner?: "platform" | "reseller";
  resellerId?: string;
};

function resellerPaystackConfig(settings: {
  paystackEnabled: boolean;
  paystackSecretKey: string | null;
  paystackPublicKey: string | null;
}): GatewayConfig | null {
  if (!settings.paystackEnabled || !settings.paystackSecretKey?.trim()) return null;
  return {
    enabled: true,
    secretKey: settings.paystackSecretKey.trim(),
    publicKey: settings.paystackPublicKey?.trim() ?? "",
    webhookSecret: "",
    defaultCurrency: "GHS",
  };
}

function resellerStripeConfig(settings: {
  stripeEnabled: boolean;
  stripeSecretKey: string | null;
  stripePublishableKey: string | null;
}): GatewayConfig | null {
  if (!settings.stripeEnabled || !settings.stripeSecretKey?.trim()) return null;
  return {
    enabled: true,
    secretKey: settings.stripeSecretKey.trim(),
    publicKey: settings.stripePublishableKey?.trim() ?? "",
    webhookSecret: "",
    defaultCurrency: "USD",
  };
}

export async function resolveResellerCheckoutContext(
  userId: string,
): Promise<ResellerCheckoutContext> {
  const link = await prisma.resellerUser.findUnique({
    where: { userId },
    select: { resellerId: true, isSuspended: true },
  });

  if (!link || link.isSuspended) {
    return { mode: "PLATFORM", resellerId: null, paystack: null, stripe: null };
  }

  const settings = await getOrCreateResellerPaymentSettings(link.resellerId);
  if (settings.checkoutMode !== "OWN") {
    return { mode: "PLATFORM", resellerId: link.resellerId, paystack: null, stripe: null };
  }

  return {
    mode: "OWN",
    resellerId: link.resellerId,
    paystack: resellerPaystackConfig(settings),
    stripe: resellerStripeConfig(settings),
  };
}

export async function resolveGatewayForPayment(
  method: PaymentMethod,
  userId: string,
  paymentMetadata?: unknown,
): Promise<GatewayConfig | null> {
  const meta = (paymentMetadata ?? {}) as PaymentCheckoutMeta;
  if (meta.checkoutOwner === "reseller" && meta.resellerId) {
    const settings = await getOrCreateResellerPaymentSettings(meta.resellerId);
    if (method === "PAYSTACK") return resellerPaystackConfig(settings);
    if (method === "STRIPE") return resellerStripeConfig(settings);
  }

  const ctx = await resolveResellerCheckoutContext(userId);
  if (ctx.mode === "OWN") {
    if (method === "PAYSTACK") return ctx.paystack;
    if (method === "STRIPE") return ctx.stripe;
  }

  return null;
}

export function buildCheckoutMetadata(ctx: ResellerCheckoutContext): PaymentCheckoutMeta | undefined {
  if (ctx.mode !== "OWN" || !ctx.resellerId) return undefined;
  return { checkoutOwner: "reseller", resellerId: ctx.resellerId };
}

export async function isResellerOwnCheckoutAvailable(userId: string, method: PaymentMethod) {
  const ctx = await resolveResellerCheckoutContext(userId);
  if (ctx.mode !== "OWN") return false;
  if (method === "PAYSTACK") return Boolean(ctx.paystack?.secretKey);
  if (method === "STRIPE") return Boolean(ctx.stripe?.secretKey);
  return false;
}
