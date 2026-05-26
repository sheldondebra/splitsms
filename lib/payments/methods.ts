import { prisma } from "@/lib/db";
import type { PaymentMethod } from "@/lib/generated/prisma/client";
import {
  isFlutterwaveConfigured,
  isPaystackConfigured,
  isStripeConfigured,
} from "@/lib/payments/gateway-settings";
import { getOfflineBankDetails } from "@/lib/payments/offline-config";

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
    description: "International cards (USD, EUR, GBP)",
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

function isConfigured(method: PaymentMethod): boolean {
  switch (method) {
    case "PAYSTACK":
      return Boolean(process.env.PAYSTACK_SECRET_KEY);
    case "FLUTTERWAVE":
      return Boolean(process.env.FLUTTERWAVE_SECRET_KEY);
    case "STRIPE":
      return Boolean(process.env.STRIPE_SECRET_KEY);
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
  const availability = await Promise.all(methods.map((m) => isConfigured(m.value)));

  return methods.map((m, i) => ({
    ...m,
    available: availability[i],
  }));
}
