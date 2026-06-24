import { prisma } from "@/lib/db";
import type { PaymentMethod } from "@/lib/generated/prisma/client";
import {
  isFlutterwaveConfigured,
  isPaystackConfigured,
  isStripeConfigured,
  resolveDefaultPaymentMethod,
  type OnlinePaymentProvider,
} from "@/lib/payments/gateway-settings";

export type PaymentMethodOption = {
  value: PaymentMethod;
  label: string;
  description: string;
  available: boolean;
  category: "online" | "offline";
};

const ALL_METHODS: Omit<PaymentMethodOption, "available">[] = [
  {
    value: "PAYSTACK",
    label: "Paystack",
    description: "Card, bank transfer & mobile money (Ghana & Africa)",
    category: "online",
  },
  {
    value: "FLUTTERWAVE",
    label: "Flutterwave",
    description: "Cards, bank & mobile money across Africa",
    category: "online",
  },
  {
    value: "STRIPE",
    label: "Stripe",
    description: "Pay with card — GHS converted to USD at the live rate",
    category: "online",
  },
  {
    value: "MTN_MOMO",
    label: "MTN MoMo",
    description: "Approve payment on your phone",
    category: "online",
  },
  {
    value: "MANUAL",
    label: "Bank transfer (offline)",
    description: "Pay at your bank, then submit proof for approval",
    category: "offline",
  },
];

async function isMethodAvailable(method: PaymentMethod): Promise<boolean> {
  switch (method) {
    case "PAYSTACK":
      return isPaystackConfigured();
    case "FLUTTERWAVE":
      return isFlutterwaveConfigured();
    case "STRIPE":
      return isStripeConfigured();
    case "MTN_MOMO":
      return Boolean(process.env.MTN_MOMO_SUBSCRIPTION_KEY);
    case "MANUAL":
      return true;
    default:
      return false;
  }
}

export async function getPaymentMethodOptions(): Promise<PaymentMethodOption[]> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: "payment_methods" },
  });
  const enabled = (row?.value as PaymentMethod[] | null) ?? [
    "PAYSTACK",
    "FLUTTERWAVE",
    "STRIPE",
    "MTN_MOMO",
    "MANUAL",
  ];

  const methods = ALL_METHODS.filter((m) => enabled.includes(m.value));
  const availability = await Promise.all(methods.map((m) => isMethodAvailable(m.value)));

  return methods.map((m, i) => ({
    ...m,
    available: availability[i],
  }));
}

export async function getDefaultPaymentMethodForUser(): Promise<PaymentMethod | null> {
  const methods = await getPaymentMethodOptions();
  const availableOnline = methods
    .filter((m) => m.available && m.category === "online")
    .map((m) => m.value as OnlinePaymentProvider);

  const resolved = await resolveDefaultPaymentMethod(availableOnline);
  if (resolved) return resolved;

  const firstAvailable = methods.find((m) => m.available);
  return firstAvailable?.value ?? null;
}
