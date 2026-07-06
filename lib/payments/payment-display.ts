import type { PaymentMethod } from "@/lib/generated/prisma/client";

export type PaymentInsight = {
  label: string;
  detail: string;
  tone: "neutral" | "warning" | "success" | "danger";
  providerPaid?: boolean;
  canAutoCredit?: boolean;
};

export type PaymentInstrumentDetails = {
  channel?: string;
  brand?: string;
  cardType?: string;
  last4?: string;
  expMonth?: string;
  expYear?: string;
  bank?: string;
  country?: string;
  funding?: string;
  payerName?: string;
  payerEmail?: string;
  payerPhone?: string;
  network?: string;
  providerPaymentId?: string;
  gatewayResponse?: string;
  capturedAt?: string;
};

export type PaymentMetadata = {
  stripeFx?: Record<string, unknown>;
  stripeSessionId?: string;
  instrument?: PaymentInstrumentDetails;
  payerName?: string;
  payerPhone?: string;
  bankName?: string;
  reference?: string;
  paidAt?: string;
  note?: string;
};

export function methodLabel(method: PaymentMethod) {
  const labels: Record<PaymentMethod, string> = {
    PAYSTACK: "Paystack",
    FLUTTERWAVE: "Flutterwave",
    STRIPE: "Stripe",
    MTN_MOMO: "MTN MoMo",
    MANUAL: "Bank transfer",
  };
  return labels[method] ?? method;
}

export function readPaymentMetadata(metadata: unknown): PaymentMetadata {
  if (!metadata || typeof metadata !== "object") return {};
  return metadata as PaymentMetadata;
}

export function readPaymentInstrument(metadata: unknown): PaymentInstrumentDetails | null {
  const m = readPaymentMetadata(metadata);
  return m.instrument ?? null;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function formatInstrumentLabel(details: PaymentInstrumentDetails | null): string | null {
  if (!details) return null;

  const channel = details.channel?.replace(/_/g, " ");
  if (details.brand && details.last4) {
    const brand = capitalize(details.brand);
    return `${brand} ···· ${details.last4}`;
  }
  if (details.network && details.last4) {
    return `${capitalize(details.network)} MoMo ···· ${details.last4}`;
  }
  if (details.network) {
    return `${capitalize(details.network)} mobile money`;
  }
  if (details.bank && channel === "bank") {
    return `Bank transfer · ${details.bank}`;
  }
  if (channel) {
    return capitalize(channel);
  }
  if (details.brand) return capitalize(details.brand);
  return null;
}

export function instrumentDetailRows(details: PaymentInstrumentDetails | null) {
  if (!details) return [];

  const rows: { key: string; label: string; value: string }[] = [];
  const summary = formatInstrumentLabel(details);

  const add = (key: string, label: string, value?: string) => {
    if (!value?.trim()) return;
    rows.push({ key, label, value: value.trim() });
  };

  if (details.cardType && !summary?.toLowerCase().includes(details.cardType.toLowerCase())) {
    add("cardType", "Card type", details.cardType);
  }
  if (details.expMonth && details.expYear) {
    add("expires", "Expires", `${details.expMonth}/${details.expYear}`);
  }
  if (details.funding) add("funding", "Funding", capitalize(details.funding));
  if (details.network && !summary?.includes(details.network)) {
    add("network", "Network", capitalize(details.network));
  }
  if (details.bank) add("bank", "Bank", details.bank);
  if (details.country) add("country", "Country", details.country.toUpperCase());
  if (details.payerName) add("payerName", "Payer", details.payerName);
  if (details.payerEmail) add("payerEmail", "Email", details.payerEmail);
  if (details.payerPhone) add("payerPhone", "Phone", details.payerPhone);
  if (details.gatewayResponse) add("gateway", "Gateway", details.gatewayResponse);

  return rows;
}

export function instrumentReferenceRows(
  details: PaymentInstrumentDetails | null,
  paymentId?: string,
  providerReference?: string | null,
) {
  const rows: { key: string; label: string; value: string }[] = [];

  if (details?.providerPaymentId) {
    rows.push({ key: "providerPaymentId", label: "Provider ref", value: details.providerPaymentId });
  }
  if (
    providerReference &&
    providerReference !== paymentId &&
    providerReference !== details?.providerPaymentId
  ) {
    rows.push({ key: "providerReference", label: "Checkout ref", value: providerReference });
  }
  if (paymentId) {
    rows.push({ key: "paymentId", label: "Payment ID", value: paymentId });
  }

  return rows;
}
