import { isMnotifyConfigured } from "@/lib/mnotify";
import {
  fetchMnotifyAccountBalance,
  loadMnotifyBalanceCache,
} from "@/lib/mnotify/balance";
import type { SmsProviderType } from "@/lib/generated/prisma/client";

export type ProviderBalanceStatus = "ok" | "unconfigured" | "error" | "unsupported";

export type ProviderSmsBalance = {
  type: SmsProviderType;
  name: string;
  status: ProviderBalanceStatus;
  /** Human-readable balance line */
  display: string;
  amount: number | null;
  currency: string | null;
  bonus: number | null;
  error?: string;
  hint?: string;
};

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function formatAmount(amount: number | null, currency: string | null, unit = ""): string {
  if (amount == null) return "—";
  const cur = currency?.trim();
  const formatted = amount.toLocaleString(undefined, {
    maximumFractionDigits: cur === "GHS" || cur === "NGN" ? 2 : 4,
  });
  if (cur) return `${cur} ${formatted}`;
  if (unit) return `${formatted} ${unit}`;
  return formatted;
}

async function fetchMnotifyBalance(): Promise<ProviderSmsBalance> {
  const name = "mNotify";
  if (!(await isMnotifyConfigured())) {
    return {
      type: "MNOTIFY",
      name,
      status: "unconfigured",
      display: "Not configured",
      amount: null,
      currency: null,
      bonus: null,
      hint: "Add API key under Admin → mNotify",
    };
  }

  const live = await fetchMnotifyAccountBalance();

  if (live.ok && live.amount != null) {
    const currency = live.currency ?? "GHS";
    const display =
      live.bonus != null && live.bonus > 0
        ? `${formatAmount(live.amount, currency)} (+ ${live.bonus.toLocaleString()} bonus)`
        : formatAmount(live.amount, currency);
    return {
      type: "MNOTIFY",
      name,
      status: "ok",
      display,
      amount: live.amount,
      currency,
      bonus: live.bonus,
      hint: live.source?.startsWith("Cached")
        ? `Live API unavailable (${live.error ?? "unknown"}). Showing last known balance.`
        : `Updated from ${live.source ?? "mNotify API"}`,
    };
  }

  const cached = await loadMnotifyBalanceCache();
  if (cached) {
    const currency = cached.currency ?? "GHS";
    const display =
      cached.bonus != null && cached.bonus > 0
        ? `${formatAmount(cached.amount, currency)} (+ ${cached.bonus.toLocaleString()} bonus)`
        : formatAmount(cached.amount, currency);
    return {
      type: "MNOTIFY",
      name,
      status: "ok",
      display,
      amount: cached.amount,
      currency,
      bonus: cached.bonus,
      hint: `Last known balance (${new Date(cached.at).toLocaleString()}) from ${cached.source}. Refresh page after sending SMS to update.`,
      error: live.error,
    };
  }

  return {
    type: "MNOTIFY",
    name,
    status: "error",
    display: "Unable to fetch",
    amount: null,
    currency: null,
    bonus: null,
    error: live.error ?? "Balance endpoint not available",
    hint: "Send a test SMS from Admin → mNotify — balance may appear in the send response. Or check balance on mNotify BMS dashboard.",
  };
}

async function fetchTwilioBalance(): Promise<ProviderSmsBalance> {
  const name = "Twilio";
  const { loadTwilioSettings } = await import("@/lib/sms/provider-credentials");
  const twilio = await loadTwilioSettings();
  const sid = twilio.accountSid;
  const token = twilio.authToken;
  if (!twilio.enabled || !sid || !token) {
    return {
      type: "TWILIO",
      name,
      status: "unconfigured",
      display: "Not configured",
      amount: null,
      currency: null,
      bonus: null,
      hint: "Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN",
    };
  }

  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Balance.json`,
      {
        headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
        cache: "no-store",
      },
    );
    const data = (await res.json()) as {
      balance?: string;
      currency?: string;
      message?: string;
    };

    if (!res.ok) {
      return {
        type: "TWILIO",
        name,
        status: "error",
        display: "Unable to fetch",
        amount: null,
        currency: null,
        bonus: null,
        error: data.message ?? `HTTP ${res.status}`,
      };
    }

    const amount = parseNumber(data.balance);
    const currency = data.currency ?? "USD";
    return {
      type: "TWILIO",
      name,
      status: "ok",
      display: formatAmount(amount, currency),
      amount,
      currency,
      bonus: null,
      hint: "Prepaid account balance (not SMS segment count)",
    };
  } catch (e) {
    return {
      type: "TWILIO",
      name,
      status: "error",
      display: "Unable to fetch",
      amount: null,
      currency: null,
      bonus: null,
      error: e instanceof Error ? e.message : "Request failed",
    };
  }
}

async function fetchInfobipBalance(): Promise<ProviderSmsBalance> {
  const name = "Infobip";
  const { loadInfobipSettings } = await import("@/lib/sms/provider-credentials");
  const infobip = await loadInfobipSettings();
  const apiKey = infobip.apiKey;
  const baseUrl = infobip.baseUrl.replace(/\/$/, "") || "https://api.infobip.com";
  if (!infobip.enabled || !apiKey) {
    return {
      type: "INFOBIP",
      name,
      status: "unconfigured",
      display: "Not configured",
      amount: null,
      currency: null,
      bonus: null,
      hint: "Set INFOBIP_API_KEY in environment",
    };
  }

  try {
    const res = await fetch(`${baseUrl}/account/1/balance`, {
      headers: {
        Authorization: `App ${apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    const data = (await res.json()) as {
      balance?: number;
      currency?: string;
      freeCredit?: number;
      message?: string;
      requestError?: { serviceException?: { text?: string } };
    };

    if (!res.ok) {
      const err =
        data.requestError?.serviceException?.text ??
        data.message ??
        `HTTP ${res.status}`;
      return {
        type: "INFOBIP",
        name,
        status: "error",
        display: "Unable to fetch",
        amount: null,
        currency: null,
        bonus: null,
        error: err,
      };
    }

    const amount = parseNumber(data.balance);
    const bonus = parseNumber(data.freeCredit);
    const currency = data.currency ?? "EUR";
    const display =
      bonus != null && bonus > 0
        ? `${formatAmount(amount, currency)} (+ ${formatAmount(bonus, currency)} free)`
        : formatAmount(amount, currency);

    return {
      type: "INFOBIP",
      name,
      status: "ok",
      display,
      amount,
      currency,
      bonus,
      hint: "Account prepaid balance from Infobip",
    };
  } catch (e) {
    return {
      type: "INFOBIP",
      name,
      status: "error",
      display: "Unable to fetch",
      amount: null,
      currency: null,
      bonus: null,
      error: e instanceof Error ? e.message : "Request failed",
    };
  }
}

/** Live balances from each upstream SMS provider (admin only). */
export async function fetchAllSmsProviderBalances(): Promise<ProviderSmsBalance[]> {
  const [mnotify, twilio, infobip] = await Promise.all([
    fetchMnotifyBalance(),
    fetchTwilioBalance(),
    fetchInfobipBalance(),
  ]);
  return [mnotify, twilio, infobip];
}
