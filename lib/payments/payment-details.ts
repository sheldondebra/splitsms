import { prisma } from "@/lib/db";
import { findStripeSessionForPayment } from "@/lib/payments/admin-payment-insights";
import {
  loadStripeSettings,
  loadPaystackSettings,
  loadFlutterwaveSettings,
} from "@/lib/payments/gateway-settings";
import type { Payment, PaymentMethod } from "@/lib/generated/prisma/client";

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

export function readPaymentMetadata(metadata: unknown): PaymentMetadata {
  if (!metadata || typeof metadata !== "object") return {};
  return metadata as PaymentMetadata;
}

export function readPaymentInstrument(metadata: unknown): PaymentInstrumentDetails | null {
  const m = readPaymentMetadata(metadata);
  return m.instrument ?? null;
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

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

async function resolveStripeSessionId(payment: Payment) {
  const meta = readPaymentMetadata(payment.metadata);
  const sessionId = meta.stripeSessionId ?? payment.providerReference ?? "";

  if (
    sessionId &&
    sessionId !== payment.id &&
    !sessionId.startsWith("pending-") &&
    sessionId.startsWith("cs_")
  ) {
    return sessionId;
  }

  const found = await findStripeSessionForPayment(payment.id, payment.createdAt);
  return found.ok ? found.sessionId : null;
}

async function captureStripeInstrument(payment: Payment): Promise<PaymentInstrumentDetails | null> {
  const sessionId = await resolveStripeSessionId(payment);
  if (!sessionId) return null;

  const { config } = await loadStripeSettings();
  if (!config.secretKey) return null;

  const url = new URL(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
  );
  url.searchParams.append("expand[]", "payment_intent");
  url.searchParams.append("expand[]", "payment_intent.payment_method");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${config.secretKey}` },
  });

  const data = (await res.json()) as {
    payment_status?: string;
    payment_intent?: {
      id?: string;
      payment_method?: StripePaymentMethod;
    };
    customer_details?: { email?: string; name?: string; phone?: string };
  };

  if (!res.ok) return null;

  const pm = data.payment_intent?.payment_method;
  const instrument: PaymentInstrumentDetails = {
    channel: pm?.type ?? "card",
    payerEmail: data.customer_details?.email,
    payerName: data.customer_details?.name,
    payerPhone: data.customer_details?.phone,
    providerPaymentId: data.payment_intent?.id ?? sessionId,
    capturedAt: new Date().toISOString(),
  };

  if (pm?.type === "card" && pm.card) {
    instrument.brand = pm.card.brand;
    instrument.last4 = pm.card.last4;
    instrument.expMonth = pm.card.exp_month != null ? String(pm.card.exp_month) : undefined;
    instrument.expYear = pm.card.exp_year != null ? String(pm.card.exp_year) : undefined;
    instrument.funding = pm.card.funding;
    instrument.country = pm.card.country;
    instrument.channel = "card";
  } else if (pm?.type === "mobile_money" && pm.mobile_money) {
    instrument.channel = "mobile_money";
    instrument.network = pm.mobile_money.carrier ?? pm.mobile_money.phone;
  } else if (pm?.type) {
    instrument.channel = pm.type;
  }

  return instrument;
}

type StripePaymentMethod = {
  type?: string;
  card?: {
    brand?: string;
    last4?: string;
    exp_month?: number;
    exp_year?: number;
    funding?: string;
    country?: string;
  };
  mobile_money?: { phone?: string; carrier?: string };
};

async function capturePaystackInstrument(payment: Payment): Promise<PaymentInstrumentDetails | null> {
  const { config } = await loadPaystackSettings();
  if (!config.secretKey) return null;

  const reference = payment.providerReference?.startsWith("pending-")
    ? payment.id
    : (payment.providerReference ?? payment.id);

  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${config.secretKey}` } },
  );

  const body = (await res.json()) as {
    data?: {
      status?: string;
      channel?: string;
      gateway_response?: string;
      reference?: string;
      authorization?: {
        brand?: string;
        card_type?: string;
        last4?: string;
        exp_month?: string;
        exp_year?: string;
        bank?: string;
        channel?: string;
        country_code?: string;
        account_name?: string;
        mobile_money_number?: string;
        receiver_bank_account_number?: string;
        receiver_bank?: string;
      };
      customer?: { email?: string; phone?: string; first_name?: string; last_name?: string };
    };
  };

  if (!body.data || body.data.status !== "success") return null;

  const d = body.data;
  const auth = d.authorization;
  const instrument: PaymentInstrumentDetails = {
    channel: d.channel ?? auth?.channel,
    gatewayResponse: d.gateway_response,
    providerPaymentId: d.reference ?? reference,
    payerEmail: d.customer?.email,
    payerPhone: d.customer?.phone ?? auth?.mobile_money_number,
    payerName: [d.customer?.first_name, d.customer?.last_name].filter(Boolean).join(" ") || auth?.account_name || undefined,
    capturedAt: new Date().toISOString(),
  };

  if (auth) {
    instrument.brand = auth.brand ?? auth.card_type?.split(" ")[0];
    instrument.cardType = auth.card_type;
    instrument.last4 = auth.last4;
    instrument.expMonth = auth.exp_month;
    instrument.expYear = auth.exp_year;
    instrument.bank = auth.bank ?? auth.receiver_bank;
    instrument.country = auth.country_code;
  }

  if (d.channel === "mobile_money" || auth?.mobile_money_number) {
    instrument.channel = "mobile_money";
    instrument.network = auth?.bank ?? auth?.brand;
    instrument.last4 = auth?.last4 ?? auth?.mobile_money_number?.slice(-4);
  }

  if (d.channel === "bank" || d.channel === "bank_transfer") {
    instrument.channel = "bank_transfer";
    instrument.bank = auth?.receiver_bank ?? auth?.bank;
    instrument.last4 = auth?.receiver_bank_account_number?.slice(-4) ?? auth?.last4;
  }

  return instrument;
}

async function captureFlutterwaveInstrument(payment: Payment): Promise<PaymentInstrumentDetails | null> {
  const { config } = await loadFlutterwaveSettings();
  if (!config.secretKey) return null;

  const txRef = payment.providerReference?.startsWith("pending-")
    ? payment.id
    : (payment.providerReference ?? payment.id);

  const listRes = await fetch(
    `https://api.flutterwave.com/v3/transactions?tx_ref=${encodeURIComponent(txRef)}`,
    { headers: { Authorization: `Bearer ${config.secretKey}` } },
  );
  const list = (await listRes.json()) as { data?: { id?: number }[] };
  const txId = list.data?.[0]?.id;
  if (!txId) return null;

  const verifyRes = await fetch(`https://api.flutterwave.com/v3/transactions/${txId}/verify`, {
    headers: { Authorization: `Bearer ${config.secretKey}` },
  });

  const verify = (await verifyRes.json()) as {
    data?: {
      status?: string;
      payment_type?: string;
      flw_ref?: string;
      processor_response?: string;
      card?: {
        type?: string;
        last_4digits?: string;
        first_6digits?: string;
        country?: string;
        issuer?: string;
        expiry?: string;
      };
      customer?: { email?: string; phone_number?: string; name?: string };
    };
  };

  if (verify.data?.status !== "successful") return null;

  const d = verify.data;
  const instrument: PaymentInstrumentDetails = {
    channel: d.payment_type?.replace(/_/g, " ") ?? "online",
    gatewayResponse: d.processor_response,
    providerPaymentId: d.flw_ref ?? String(txId),
    payerEmail: d.customer?.email,
    payerPhone: d.customer?.phone_number,
    payerName: d.customer?.name,
    capturedAt: new Date().toISOString(),
  };

  if (d.card) {
    instrument.brand = d.card.type ?? d.card.issuer;
    instrument.cardType = d.card.type;
    instrument.last4 = d.card.last_4digits;
    instrument.bank = d.card.issuer;
    instrument.country = d.card.country;
    if (d.card.expiry) {
      const [mm, yy] = d.card.expiry.split("/");
      instrument.expMonth = mm;
      instrument.expYear = yy;
    }
    instrument.channel = "card";
  }

  const pt = d.payment_type?.toLowerCase() ?? "";
  if (pt.includes("mobile") || pt.includes("momo") || pt.includes("mpesa")) {
    instrument.channel = "mobile_money";
    instrument.network = d.card?.issuer ?? d.payment_type;
  }

  return instrument;
}

function captureManualInstrument(payment: Payment): PaymentInstrumentDetails {
  const meta = readPaymentMetadata(payment.metadata);
  return {
    channel: "bank_transfer",
    bank: meta.bankName,
    payerName: meta.payerName,
    payerPhone: meta.payerPhone,
    providerPaymentId: meta.reference,
    gatewayResponse: meta.note,
    capturedAt: new Date().toISOString(),
  };
}

export async function capturePaymentDetails(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return null;

  const existing = readPaymentInstrument(payment.metadata);
  if (existing?.capturedAt && (existing.last4 || existing.network || existing.bank)) {
    return existing;
  }

  let instrument: PaymentInstrumentDetails | null = null;

  switch (payment.method as PaymentMethod) {
    case "STRIPE":
      instrument = await captureStripeInstrument(payment);
      break;
    case "PAYSTACK":
      instrument = await capturePaystackInstrument(payment);
      break;
    case "FLUTTERWAVE":
      instrument = await captureFlutterwaveInstrument(payment);
      break;
    case "MANUAL":
      instrument = captureManualInstrument(payment);
      break;
    case "MTN_MOMO":
      instrument = {
        channel: "mobile_money",
        network: "MTN",
        capturedAt: new Date().toISOString(),
      };
      break;
    default:
      break;
  }

  if (!instrument) return existing;

  const meta = readPaymentMetadata(payment.metadata);
  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      metadata: {
        ...meta,
        instrument,
      } as object,
    },
  });

  return instrument;
}

export async function ensurePaymentDetails(payment: Payment) {
  const existing = readPaymentInstrument(payment.metadata);
  if (existing?.last4 || existing?.network || existing?.bank || existing?.brand) {
    return existing;
  }
  if (payment.status !== "COMPLETED" && payment.method !== "MANUAL") {
    return existing;
  }
  return capturePaymentDetails(payment.id);
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
  if (providerReference && providerReference !== paymentId && providerReference !== details?.providerPaymentId) {
    rows.push({ key: "providerReference", label: "Checkout ref", value: providerReference });
  }
  if (paymentId) {
    rows.push({ key: "paymentId", label: "Payment ID", value: paymentId });
  }

  return rows;
}
