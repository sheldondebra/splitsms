/**
 * mNotify BMS — primary SMS provider for SplitSMS (Ghana / Africa first).
 * Settings loaded from Admin Dashboard (PlatformSetting) with .env fallback.
 * @see https://readthedocs.mnotify.com/
 */

import { loadMnotifySettings } from "@/lib/mnotify-settings";
import {
  cacheBalanceFromMnotifyResponse,
  saveMnotifyBalanceCache,
} from "@/lib/mnotify/balance";
import { buildMnotifyUrl, trimApiKey } from "@/lib/mnotify/internal";

export type MnotifyQuickSmsParams = {
  recipients: string[];
  sender: string;
  message: string;
  isSchedule?: boolean;
  scheduleDate?: string;
};

export type MnotifyQuickSmsResponse = {
  status?: string;
  code?: string;
  message?: string;
  summary?: Record<string, unknown>;
  campaign_id?: string;
  [key: string]: unknown;
};

export async function getMnotifyConfig() {
  const s = await loadMnotifySettings();
  return {
    apiKey: s.apiKey,
    baseUrl: s.baseUrl,
    defaultSender: s.defaultSenderId,
    enabled: s.enabled,
    mnotifyFirst: s.mnotifyFirst,
    allowFailover: s.allowFailover,
  };
}

export async function isMnotifyConfigured() {
  const { apiKey, enabled } = await getMnotifyConfig();
  return enabled && Boolean(apiKey);
}

/** International digits without + (mNotify expects e.g. 233558185288, not 0558185288). */
export function normalizeMnotifyPhone(phone: string) {
  let digits = phone.replace(/\s+/g, "").replace(/[^\d]/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  // Ghana local: 0558185288 → 233558185288
  if (digits.startsWith("0") && digits.length >= 10) {
    digits = `233${digits.slice(1)}`;
  }
  return digits;
}

function parseMnotifyError(
  data: MnotifyQuickSmsResponse | Record<string, unknown>,
  status: number,
): string {
  const msg =
    (typeof data.message === "string" && data.message) ||
    (typeof data.status === "string" && data.status !== "success" ? data.status : "") ||
    (typeof data.error === "string" && data.error) ||
    "";

  if (status === 401) {
    return (
      msg ||
      "mNotify rejected the API key (HTTP 401). Generate a new key at mNotify BMS → Developer, paste it in Admin → mNotify (Save), and confirm “Enable mNotify” is checked."
    );
  }
  if (status === 403) {
    return msg || "mNotify forbidden (HTTP 403) — sender ID may not be approved for this account.";
  }
  return msg || `mNotify HTTP ${status}`;
}

/** Lightweight check that the stored API key is accepted by mNotify. */
export async function verifyMnotifyApiKey(): Promise<{
  ok: boolean;
  error?: string;
  balance?: number;
}> {
  const { fetchMnotifyAccountBalance } = await import("@/lib/mnotify/balance");
  const result = await fetchMnotifyAccountBalance();
  if (result.ok && result.amount != null) {
    return { ok: true, balance: result.amount };
  }
  if (result.ok) {
    return { ok: true };
  }
  return { ok: false, error: result.error };
}

export async function sendMnotifyQuickSms(
  params: MnotifyQuickSmsParams,
  overrides?: { apiKey?: string; baseUrl?: string },
) {
  const config = await getMnotifyConfig();
  const apiKey = trimApiKey(overrides?.apiKey ?? config.apiKey);
  const baseUrl = (overrides?.baseUrl ?? config.baseUrl).replace(/\/$/, "");

  if (!config.enabled) {
    return { ok: false as const, error: "mNotify is disabled in Admin settings" };
  }
  if (!apiKey) {
    return {
      ok: false as const,
      error: "mNotify API key not set — configure in Admin → mNotify",
    };
  }

  const url = buildMnotifyUrl(baseUrl, "/api/sms/quick", apiKey);
  const recipients = params.recipients.map(normalizeMnotifyPhone);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        recipient: recipients,
        sender: params.sender.trim(),
        message: params.message,
        is_schedule: params.isSchedule ?? false,
        schedule_date: params.scheduleDate ?? "",
      }),
    });

    const data = (await res.json()) as MnotifyQuickSmsResponse;

    if (!res.ok) {
      return {
        ok: false as const,
        error: parseMnotifyError(data, res.status),
        httpStatus: res.status,
      };
    }

    const providerRef = String(data.campaign_id ?? data.code ?? `mnotify-${Date.now()}`);

    const cached = cacheBalanceFromMnotifyResponse(data, "sms/quick response");
    if (cached) {
      await saveMnotifyBalanceCache(cached).catch(() => undefined);
    }

    return { ok: true as const, data, providerRef };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "mNotify request failed",
    };
  }
}

export async function sendMnotifyOtp(phone: string, code: string, message?: string) {
  const { defaultSender } = await getMnotifyConfig();
  return sendMnotifyQuickSms({
    recipients: [phone],
    sender: defaultSender,
    message:
      message ?? `Your SplitSMS verification code is ${code}. Valid for 10 minutes.`,
  });
}

export type MnotifyDeliveryRow = {
  _id?: string | number;
  recipient?: string;
  status?: string;
  campaign_id?: string;
  date_sent?: string;
  message?: string;
  sender?: string;
};

/** Campaign-level delivery report (use campaign_id from send response) */
export async function fetchCampaignDeliveryReport(
  campaignId: string,
  statusFilter?: "delivered" | "undelivered" | "submitted" | "failed" | "rejected" | null,
) {
  const config = await getMnotifyConfig();
  if (!config.apiKey) {
    return { ok: false as const, error: "mNotify API key not configured" };
  }

  const statusPath = statusFilter ? `/${statusFilter}` : "";
  const url = `${config.baseUrl}/api/campaign/${encodeURIComponent(campaignId)}${statusPath}?key=${encodeURIComponent(config.apiKey)}`;

  try {
    const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
    const data = (await res.json()) as {
      status?: string;
      report?: MnotifyDeliveryRow[];
      message?: string;
    };
    if (!res.ok) {
      return { ok: false as const, error: data?.message ?? `mNotify HTTP ${res.status}` };
    }
    return { ok: true as const, report: data.report ?? [], raw: data };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Failed to fetch delivery report",
    };
  }
}

/** Single-message delivery report (use _id from campaign report rows) */
export async function fetchMessageDeliveryReport(messageId: string) {
  const config = await getMnotifyConfig();
  if (!config.apiKey) {
    return { ok: false as const, error: "mNotify API key not configured" };
  }

  const url = `${config.baseUrl}/api/status/${encodeURIComponent(messageId)}?key=${encodeURIComponent(config.apiKey)}`;

  try {
    const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
    const data = (await res.json()) as {
      status?: string;
      report?: MnotifyDeliveryRow;
      message?: string;
    };
    if (!res.ok) {
      return { ok: false as const, error: data?.message ?? `mNotify HTTP ${res.status}` };
    }
    return { ok: true as const, report: data.report ?? null, raw: data };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Failed to fetch message status",
    };
  }
}

/** Alias used in sprint docs */
export const fetchDeliveryReport = fetchCampaignDeliveryReport;

export async function getMnotifyStatus() {
  const s = await loadMnotifySettings();
  return {
    configured: s.enabled && Boolean(s.apiKey),
    enabled: s.enabled,
    baseUrl: s.baseUrl,
    defaultSenderId: s.defaultSenderId,
    firstProvider: s.mnotifyFirst,
    allowFailover: s.allowFailover,
    source: s.updatedAt ? "admin" as const : "env" as const,
    updatedAt: s.updatedAt,
    hasApiKey: Boolean(s.apiKey),
  };
}

export type MnotifySenderIdSummary = {
  sender_name?: string;
  purpose?: string;
  status?: string;
  "sender name"?: string;
};

export type MnotifySenderIdResponse = {
  status?: string;
  code?: string;
  message?: string;
  summary?: MnotifySenderIdSummary;
};

/** Register a sender ID with mNotify (Ghana / primary route). */
export async function registerMnotifySenderId(senderName: string, purpose: string) {
  const config = await getMnotifyConfig();
  if (!config.enabled || !config.apiKey) {
    return { ok: false as const, error: "mNotify is not configured" };
  }

  const url = `${config.baseUrl}/api/senderid/register?key=${encodeURIComponent(config.apiKey)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender_name: senderName,
        purpose,
      }),
    });

    const data = (await res.json()) as MnotifySenderIdResponse;
    const providerStatus = data.summary?.status;

    if (!res.ok) {
      return {
        ok: false as const,
        error: data.message ?? data.status ?? `mNotify HTTP ${res.status}`,
        providerStatus,
        raw: data,
      };
    }

    return {
      ok: true as const,
      providerStatus: providerStatus ?? "Pending",
      message: data.message,
      raw: data,
    };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "mNotify sender ID registration failed",
    };
  }
}

/** Check sender ID approval status at mNotify. */
export async function checkMnotifySenderIdStatus(senderName: string) {
  const config = await getMnotifyConfig();
  if (!config.enabled || !config.apiKey) {
    return { ok: false as const, error: "mNotify is not configured" };
  }

  const url = `${config.baseUrl}/api/senderid/status?key=${encodeURIComponent(config.apiKey)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ sender_name: senderName }),
    });

    const data = (await res.json()) as MnotifySenderIdResponse;
    const providerStatus =
      data.summary?.status ??
      (data.summary as { status?: string; "sender name"?: string } | undefined)?.status;

    if (!res.ok) {
      return {
        ok: false as const,
        error: data.message ?? data.status ?? `mNotify HTTP ${res.status}`,
        providerStatus,
        raw: data,
      };
    }

    return {
      ok: true as const,
      providerStatus: providerStatus ?? "Pending",
      raw: data,
    };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "mNotify sender ID status check failed",
    };
  }
}
