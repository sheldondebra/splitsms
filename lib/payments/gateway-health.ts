import {
  loadFlutterwaveSettings,
  loadPaystackSettings,
  loadStripeSettings,
  type GatewayLastTest,
} from "@/lib/payments/gateway-settings";

export type GatewayHealthResult = Pick<GatewayLastTest, "ok" | "error" | "details">;

export async function testPaystackConnection(): Promise<GatewayHealthResult> {
  const { config } = await loadPaystackSettings();
  if (!config.secretKey) {
    return { ok: false, error: "Secret key is not set" };
  }

  const res = await fetch("https://api.paystack.co/balance", {
    headers: { Authorization: `Bearer ${config.secretKey}` },
  });

  const data = (await res.json()) as {
    status?: boolean;
    message?: string;
    data?: { currency?: string; balance?: number }[];
  };

  if (!res.ok || !data.status) {
    return { ok: false, error: data.message ?? `HTTP ${res.status}` };
  }

  const balances = (data.data ?? []).map((b) => ({
    currency: b.currency,
    balance: typeof b.balance === "number" ? b.balance / 100 : b.balance,
  }));

  return {
    ok: true,
    details: {
      balances,
      defaultCurrency: config.defaultCurrency,
      mode: config.secretKey.startsWith("sk_test") ? "test" : "live",
    },
  };
}

export async function testFlutterwaveConnection(): Promise<GatewayHealthResult> {
  const { config } = await loadFlutterwaveSettings();
  if (!config.secretKey) {
    return { ok: false, error: "Secret key is not set" };
  }

  const currency = config.defaultCurrency || "NGN";
  const res = await fetch(`https://api.flutterwave.com/v3/balances/${currency}`, {
    headers: { Authorization: `Bearer ${config.secretKey}` },
  });

  const data = (await res.json()) as {
    status?: string;
    message?: string;
    data?: {
      currency?: string;
      available_balance?: number;
      ledger_balance?: number;
    };
  };

  if (!res.ok || data.status !== "success") {
    return { ok: false, error: data.message ?? `HTTP ${res.status}` };
  }

  return {
    ok: true,
    details: {
      currency: data.data?.currency ?? currency,
      availableBalance: data.data?.available_balance,
      ledgerBalance: data.data?.ledger_balance,
      mode: config.secretKey.startsWith("FLWSECK_TEST") ? "test" : "live",
    },
  };
}

export async function testStripeConnection(): Promise<GatewayHealthResult> {
  const { config } = await loadStripeSettings();
  if (!config.secretKey) {
    return { ok: false, error: "Secret key is not set" };
  }

  const res = await fetch("https://api.stripe.com/v1/balance", {
    headers: { Authorization: `Bearer ${config.secretKey}` },
  });

  const data = (await res.json()) as {
    available?: { amount?: number; currency?: string }[];
    pending?: { amount?: number; currency?: string }[];
    error?: { message?: string };
    livemode?: boolean;
  };

  if (!res.ok) {
    return { ok: false, error: data.error?.message ?? `HTTP ${res.status}` };
  }

  const available = (data.available ?? []).map((b) => ({
    currency: b.currency?.toUpperCase(),
    amount: typeof b.amount === "number" ? b.amount / 100 : b.amount,
  }));

  return {
    ok: true,
    details: {
      available,
      livemode: data.livemode,
      defaultCurrency: config.defaultCurrency,
    },
  };
}
