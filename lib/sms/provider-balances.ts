import { isMnotifyConfigured } from "@/lib/mnotify";
import {
  fetchMnotifyAccountBalance,
  loadMnotifyBalanceCache,
} from "@/lib/mnotify/balance";
import type { SmsProviderType } from "@/lib/generated/prisma/client";
import { loadProviderBalanceHistory } from "@/lib/sms/provider-balance-history";
import { loadMnotifySettings } from "@/lib/mnotify-settings";
import {
  loadTwilioSettings,
  loadInfobipSettings,
  loadEasySendSmsSettings,
} from "@/lib/sms/provider-credentials";

export type ProviderBalanceStatus =
  | "ok"
  | "unconfigured"
  | "error"
  | "unsupported"
  | "disabled";

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
  /** Whether outbound SMS via this provider is enabled. */
  enabled?: boolean;
  /** ISO time of the last recorded balance check (manual, refresh-all, or sync). */
  checkedAt?: string | null;
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

/** mNotify reports SMS credits, not wallet currency. */
function formatSmsCredits(amount: number | null, bonus: number | null = null): string {
  if (amount == null) return "—";
  const formatted = amount.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (bonus != null && bonus > 0) {
    return `${formatted} credits (+ ${bonus.toLocaleString()} bonus)`;
  }
  return `${formatted} credits`;
}

export async function fetchMnotifyBalance(): Promise<ProviderSmsBalance> {
  const name = "mNotify";
  const settings = await loadMnotifySettings();
  const hasKey = Boolean(settings.apiKey || process.env.MNOTIFY_API_KEY?.trim());

  if (!settings.enabled) {
    return {
      type: "MNOTIFY",
      name,
      status: "disabled",
      display: "Disabled",
      amount: null,
      currency: null,
      bonus: null,
      enabled: false,
      hint: hasKey
        ? "Provider is turned off — enable it to send via mNotify."
        : "Provider is turned off. Add an API key under Admin → mNotify.",
    };
  }

  if (!(await isMnotifyConfigured())) {
    return {
      type: "MNOTIFY",
      name,
      status: "unconfigured",
      display: "Not configured",
      amount: null,
      currency: null,
      bonus: null,
      enabled: true,
      hint: "Add API key under Admin → mNotify",
    };
  }

  const live = await fetchMnotifyAccountBalance();

  if (live.ok && live.amount != null) {
    const display = formatSmsCredits(live.amount, live.bonus);
    return {
      type: "MNOTIFY",
      name,
      status: "ok",
      display,
      amount: live.amount,
      currency: null,
      bonus: live.bonus,
      enabled: true,
      hint: live.source?.startsWith("Cached")
        ? `Live API unavailable (${live.error ?? "unknown"}). Showing last known balance.`
        : `Updated from ${live.source ?? "mNotify API"}`,
    };
  }

  const cached = await loadMnotifyBalanceCache();
  if (cached) {
    const display = formatSmsCredits(cached.amount, cached.bonus);
    return {
      type: "MNOTIFY",
      name,
      status: "ok",
      display,
      amount: cached.amount,
      currency: null,
      bonus: cached.bonus,
      enabled: true,
      checkedAt: cached.at,
      hint: `Last known balance from ${cached.source}. Refresh to update.`,
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
    enabled: true,
    error: live.error ?? "Balance endpoint not available",
    hint: "Send a test SMS from Admin → mNotify — balance may appear in the send response. Or check balance on mNotify BMS dashboard.",
  };
}

async function fetchTwilioBalance(): Promise<ProviderSmsBalance> {
  const name = "Twilio";
  const twilio = await loadTwilioSettings();
  const sid = twilio.accountSid;
  const token = twilio.authToken;
  const hasCreds = Boolean(sid && token);

  if (!twilio.enabled) {
    return {
      type: "TWILIO",
      name,
      status: "disabled",
      display: "Disabled",
      amount: null,
      currency: null,
      bonus: null,
      enabled: false,
      hint: hasCreds
        ? "Provider is turned off — enable it to send via Twilio."
        : "Provider is turned off. Add Twilio credentials under Admin → Providers.",
    };
  }

  if (!hasCreds) {
    return {
      type: "TWILIO",
      name,
      status: "unconfigured",
      display: "Not configured",
      amount: null,
      currency: null,
      bonus: null,
      enabled: true,
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
  const infobip = await loadInfobipSettings();
  const apiKey = infobip.apiKey;
  const baseUrl = infobip.baseUrl.replace(/\/$/, "") || "https://api.infobip.com";
  const hasKey = Boolean(apiKey);

  if (!infobip.enabled) {
    return {
      type: "INFOBIP",
      name,
      status: "disabled",
      display: "Disabled",
      amount: null,
      currency: null,
      bonus: null,
      enabled: false,
      hint: hasKey
        ? "Provider is turned off — enable it to send via Infobip."
        : "Provider is turned off. Add an API key under Admin → Providers.",
    };
  }

  if (!hasKey) {
    return {
      type: "INFOBIP",
      name,
      status: "unconfigured",
      display: "Not configured",
      amount: null,
      currency: null,
      bonus: null,
      enabled: true,
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

async function fetchEasySendSmsBalance(): Promise<ProviderSmsBalance> {
  const name = "EasySendSMS";
  const cfg = await loadEasySendSmsSettings();
  const hasKey = Boolean(cfg.apiKey);

  if (!cfg.enabled) {
    return {
      type: "EASYSENDSMS",
      name,
      status: "disabled",
      display: "Disabled",
      amount: null,
      currency: null,
      bonus: null,
      enabled: false,
      hint: hasKey
        ? "Provider is turned off — enable it to send via EasySendSMS."
        : "Provider is turned off. Add an API key under Admin → Providers.",
    };
  }

  if (!hasKey) {
    return {
      type: "EASYSENDSMS",
      name,
      status: "unconfigured",
      display: "Not configured",
      amount: null,
      currency: null,
      bonus: null,
      enabled: true,
      hint: "Add API key under Admin → Providers → EasySendSMS",
    };
  }

  try {
    const res = await fetch("https://restapi.easysendsms.app/v1/rest/sms/balance", {
      method: "POST",
      headers: {
        apikey: cfg.apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await res.json().catch(() => ({}))) as {
      balance?: number;
      error?: number;
      description?: string;
    };

    if (!res.ok || data.balance == null) {
      return {
        type: "EASYSENDSMS",
        name,
        status: "error",
        display: "Unable to fetch",
        amount: null,
        currency: null,
        bonus: null,
        error: data.description ?? `HTTP ${res.status}`,
      };
    }

    const amount = parseNumber(data.balance);
    return {
      type: "EASYSENDSMS",
      name,
      status: "ok",
      display: formatSmsCredits(amount),
      amount,
      currency: null,
      bonus: null,
      hint: "Account SMS credit balance from EasySendSMS",
    };
  } catch (e) {
    return {
      type: "EASYSENDSMS",
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

/** Attach last-check timestamps from balance history (without re-fetching APIs). */
export async function enrichProviderBalanceMeta(
  balances: ProviderSmsBalance[],
): Promise<ProviderSmsBalance[]> {
  const history = await loadProviderBalanceHistory();
  const latestAt = new Map<SmsProviderType, string>();
  for (const entry of history) {
    if (!latestAt.has(entry.type)) latestAt.set(entry.type, entry.at);
  }

  return balances.map((b) => ({
    ...b,
    enabled: b.enabled ?? b.status !== "disabled",
    checkedAt: b.checkedAt ?? latestAt.get(b.type) ?? null,
  }));
}

/** Live balances from each upstream SMS provider (admin only). */
export async function fetchSmsProviderBalance(
  type: SmsProviderType,
): Promise<ProviderSmsBalance> {
  const balance =
    type === "MNOTIFY"
      ? await fetchMnotifyBalance()
      : type === "TWILIO"
        ? await fetchTwilioBalance()
        : type === "INFOBIP"
          ? await fetchInfobipBalance()
          : await fetchEasySendSmsBalance();
  const [enriched] = await enrichProviderBalanceMeta([balance]);
  return enriched;
}

/** Live balances from each upstream SMS provider (admin only). */
export async function fetchAllSmsProviderBalances(): Promise<ProviderSmsBalance[]> {
  const [mnotify, twilio, infobip, easysendsms] = await Promise.all([
    fetchMnotifyBalance(),
    fetchTwilioBalance(),
    fetchInfobipBalance(),
    fetchEasySendSmsBalance(),
  ]);
  return enrichProviderBalanceMeta([mnotify, twilio, infobip, easysendsms]);
}
