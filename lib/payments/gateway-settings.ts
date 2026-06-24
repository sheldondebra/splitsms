import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

export const PAYSTACK_CONFIG_KEY = "paystack_config";
export const FLUTTERWAVE_CONFIG_KEY = "flutterwave_config";
export const STRIPE_CONFIG_KEY = "stripe_config";
export const DEFAULT_PAYMENT_PROVIDER_KEY = "default_payment_provider";

export type OnlinePaymentProvider = "PAYSTACK" | "FLUTTERWAVE" | "STRIPE";

export type GatewayConfig = {
  enabled: boolean;
  secretKey: string;
  publicKey: string;
  webhookSecret: string;
  defaultCurrency: string;
  updatedAt?: string;
};

export type GatewayConfigSource = "admin" | "environment" | "none";

const defaultGateway = (currency: string): GatewayConfig => ({
  enabled: true,
  secretKey: "",
  publicKey: "",
  webhookSecret: "",
  defaultCurrency: currency,
});

function envSecret(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (value?.trim()) return value.trim();
  }
  return "";
}

async function loadGatewayConfig(
  key: string,
  envKeys: { secret: string[]; public?: string[]; webhook?: string[]; currency: string },
): Promise<{ config: GatewayConfig; source: GatewayConfigSource }> {
  const row = await prisma.platformSetting.findUnique({ where: { key } });
  const stored = row?.value as Partial<GatewayConfig> | null;
  const base = defaultGateway(envKeys.currency);

  if (!stored) {
    const secretKey = envSecret(...envKeys.secret);
    const publicKey = envKeys.public ? envSecret(...envKeys.public) : "";
    const webhookSecret = envKeys.webhook ? envSecret(...envKeys.webhook) : "";
    if (!secretKey) {
      return { config: base, source: "none" };
    }
    return {
      config: {
        ...base,
        secretKey,
        publicKey,
        webhookSecret,
      },
      source: "environment",
    };
  }

  const secretKey = stored.secretKey || envSecret(...envKeys.secret);
  const publicKey = stored.publicKey || (envKeys.public ? envSecret(...envKeys.public) : "");
  const webhookSecret =
    stored.webhookSecret || (envKeys.webhook ? envSecret(...envKeys.webhook) : "");

  return {
    config: {
      enabled: stored.enabled ?? base.enabled,
      secretKey,
      publicKey,
      webhookSecret,
      defaultCurrency: stored.defaultCurrency || base.defaultCurrency,
      updatedAt: stored.updatedAt,
    },
    source: stored.secretKey ? "admin" : secretKey ? "environment" : "none",
  };
}

async function saveGatewayConfig(
  key: string,
  current: GatewayConfig,
  input: Partial<GatewayConfig>,
  actorId?: string,
  auditAction?: string,
) {
  const next: GatewayConfig = {
    enabled: input.enabled ?? current.enabled,
    secretKey:
      input.secretKey !== undefined && input.secretKey.trim() !== ""
        ? input.secretKey.trim()
        : current.secretKey,
    publicKey:
      input.publicKey !== undefined && input.publicKey.trim() !== ""
        ? input.publicKey.trim()
        : current.publicKey,
    webhookSecret:
      input.webhookSecret !== undefined && input.webhookSecret.trim() !== ""
        ? input.webhookSecret.trim()
        : current.webhookSecret,
    defaultCurrency: (input.defaultCurrency ?? current.defaultCurrency).trim().toUpperCase(),
    updatedAt: new Date().toISOString(),
  };

  await prisma.platformSetting.upsert({
    where: { key },
    update: { value: next },
    create: { key, value: next },
  });

  if (actorId && auditAction) {
    await prisma.auditLog.create({
      data: {
        actorId,
        action: auditAction,
        entityType: "PlatformSetting",
        entityId: key,
        metadata: {
          enabled: next.enabled,
          hasSecretKey: Boolean(next.secretKey),
          defaultCurrency: next.defaultCurrency,
        },
      },
    });
  }

  return next;
}

export function maskSecret(value: string) {
  if (!value) return "";
  if (value.length <= 8) return "••••••••";
  return `${"•".repeat(Math.min(20, value.length - 4))}${value.slice(-4)}`;
}

export async function loadPaystackSettings() {
  return loadGatewayConfig(PAYSTACK_CONFIG_KEY, {
    secret: ["PAYSTACK_SECRET_KEY"],
    public: ["PAYSTACK_PUBLIC_KEY", "NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY"],
    currency: "GHS",
  });
}

export async function loadFlutterwaveSettings() {
  return loadGatewayConfig(FLUTTERWAVE_CONFIG_KEY, {
    secret: ["FLUTTERWAVE_SECRET_KEY"],
    public: ["FLUTTERWAVE_PUBLIC_KEY", "NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY"],
    webhook: ["FLUTTERWAVE_WEBHOOK_SECRET", "FLUTTERWAVE_SECRET_HASH"],
    currency: "NGN",
  });
}

export async function loadStripeSettings() {
  return loadGatewayConfig(STRIPE_CONFIG_KEY, {
    secret: ["STRIPE_SECRET_KEY"],
    public: ["STRIPE_PUBLISHABLE_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
    webhook: ["STRIPE_WEBHOOK_SECRET"],
    currency: "USD",
  });
}

export async function savePaystackSettings(
  input: Partial<GatewayConfig>,
  actorId?: string,
) {
  const { config } = await loadPaystackSettings();
  return saveGatewayConfig(
    PAYSTACK_CONFIG_KEY,
    config,
    input,
    actorId,
    "PAYSTACK_SETTINGS_UPDATED",
  );
}

export async function saveFlutterwaveSettings(
  input: Partial<GatewayConfig>,
  actorId?: string,
) {
  const { config } = await loadFlutterwaveSettings();
  return saveGatewayConfig(
    FLUTTERWAVE_CONFIG_KEY,
    config,
    input,
    actorId,
    "FLUTTERWAVE_SETTINGS_UPDATED",
  );
}

export async function saveStripeSettings(input: Partial<GatewayConfig>, actorId?: string) {
  const { config } = await loadStripeSettings();
  return saveGatewayConfig(STRIPE_CONFIG_KEY, config, input, actorId, "STRIPE_SETTINGS_UPDATED");
}

export async function isPaystackConfigured() {
  const { config } = await loadPaystackSettings();
  return config.enabled && Boolean(config.secretKey);
}

export async function isFlutterwaveConfigured() {
  const { config } = await loadFlutterwaveSettings();
  return config.enabled && Boolean(config.secretKey);
}

export async function isStripeConfigured() {
  const { config } = await loadStripeSettings();
  return config.enabled && Boolean(config.secretKey);
}

export async function loadDefaultPaymentProvider(): Promise<OnlinePaymentProvider | null> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: DEFAULT_PAYMENT_PROVIDER_KEY },
  });
  const value = row?.value;
  if (value === "PAYSTACK" || value === "FLUTTERWAVE" || value === "STRIPE") {
    return value;
  }
  return null;
}

export async function saveDefaultPaymentProvider(
  provider: OnlinePaymentProvider,
  actorId?: string,
) {
  await prisma.platformSetting.upsert({
    where: { key: DEFAULT_PAYMENT_PROVIDER_KEY },
    update: { value: provider },
    create: { key: DEFAULT_PAYMENT_PROVIDER_KEY, value: provider },
  });

  if (actorId) {
    await prisma.auditLog.create({
      data: {
        actorId,
        action: "DEFAULT_PAYMENT_PROVIDER_UPDATED",
        entityType: "PlatformSetting",
        entityId: DEFAULT_PAYMENT_PROVIDER_KEY,
        metadata: { provider },
      },
    });
  }
}

export async function resolveDefaultPaymentMethod(
  availableMethods: OnlinePaymentProvider[],
): Promise<OnlinePaymentProvider | null> {
  const stored = await loadDefaultPaymentProvider();
  if (stored && availableMethods.includes(stored)) {
    return stored;
  }
  return availableMethods[0] ?? null;
}

export type GatewayOverview = {
  id: "paystack" | "flutterwave" | "stripe";
  label: string;
  enabled: boolean;
  configured: boolean;
  source: GatewayConfigSource;
  maskedSecret: string;
  defaultCurrency: string;
  publicKeySet: boolean;
  webhookSet: boolean;
};

export async function getPaymentGatewaysOverview(): Promise<GatewayOverview[]> {
  const [paystack, flutterwave, stripe] = await Promise.all([
    loadPaystackSettings(),
    loadFlutterwaveSettings(),
    loadStripeSettings(),
  ]);

  return [
    {
      id: "paystack",
      label: "Paystack",
      enabled: paystack.config.enabled,
      configured: Boolean(paystack.config.secretKey),
      source: paystack.source,
      maskedSecret: maskSecret(paystack.config.secretKey),
      defaultCurrency: paystack.config.defaultCurrency,
      publicKeySet: Boolean(paystack.config.publicKey),
      webhookSet: Boolean(paystack.config.webhookSecret),
    },
    {
      id: "flutterwave",
      label: "Flutterwave",
      enabled: flutterwave.config.enabled,
      configured: Boolean(flutterwave.config.secretKey),
      source: flutterwave.source,
      maskedSecret: maskSecret(flutterwave.config.secretKey),
      defaultCurrency: flutterwave.config.defaultCurrency,
      publicKeySet: Boolean(flutterwave.config.publicKey),
      webhookSet: Boolean(flutterwave.config.webhookSecret),
    },
    {
      id: "stripe",
      label: "Stripe",
      enabled: stripe.config.enabled,
      configured: Boolean(stripe.config.secretKey),
      source: stripe.source,
      maskedSecret: maskSecret(stripe.config.secretKey),
      defaultCurrency: stripe.config.defaultCurrency,
      publicKeySet: Boolean(stripe.config.publicKey),
      webhookSet: Boolean(stripe.config.webhookSecret),
    },
  ];
}

export type GatewayLastTest = {
  at: string;
  ok: boolean;
  error?: string | null;
  details?: Record<string, unknown> | null;
};

export async function loadGatewayLastTest(key: string): Promise<GatewayLastTest | null> {
  const row = await prisma.platformSetting.findUnique({ where: { key } });
  if (!row?.value) return null;
  return row.value as GatewayLastTest;
}

export async function saveGatewayLastTest(
  key: string,
  result: Omit<GatewayLastTest, "at"> & { at?: string },
) {
  const value: Prisma.InputJsonValue = {
    at: result.at ?? new Date().toISOString(),
    ok: result.ok,
    error: result.error ?? null,
    details: (result.details ?? null) as Prisma.InputJsonValue,
  };
  await prisma.platformSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  return value as unknown as GatewayLastTest;
}
