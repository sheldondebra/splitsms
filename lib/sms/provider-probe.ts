import { loadMnotifySettings } from "@/lib/mnotify-settings";
import { mnotifyApiGet, trimApiKey } from "@/lib/mnotify/internal";
import type { SmsProviderType } from "@/lib/generated/prisma/client";
import {
  loadEasySendSmsSettings,
  loadInfobipSettings,
  loadTwilioSettings,
} from "@/lib/sms/provider-credentials";

export type ProviderProbeVerdict = "good" | "ok" | "bad" | "skipped";

export type ProviderProbeResult = {
  type: SmsProviderType;
  name: string;
  endpoint: string;
  verdict: ProviderProbeVerdict;
  httpStatus: number | null;
  latencyMs: number | null;
  latencySec: number | null;
  data: string;
  error: string | null;
};

const SECRET_KEY = /key|token|secret|password|authorization|apikey/i;
const MAX_DATA_CHARS = 600;
const GOOD_LATENCY_MS = 2500;
const MNOTIFY_BALANCE_PATHS = ["/api/balance/sms", "/balance/sms"];

type TimedRequest = {
  httpStatus: number | null;
  httpOk: boolean;
  latencyMs: number;
  data: string;
  error: string | null;
};

export function sanitizeProbePayload(value: unknown): string {
  const seen = new WeakSet<object>();
  const json = JSON.stringify(
    value,
    (key, nested) => {
      if (SECRET_KEY.test(key)) return "[redacted]";
      if (nested && typeof nested === "object") {
        if (seen.has(nested as object)) return "[circular]";
        seen.add(nested as object);
      }
      if (typeof nested === "string" && nested.length > 240) {
        return `${nested.slice(0, 240)}…`;
      }
      return nested;
    },
    2,
  );
  if (!json) return "—";
  return json.length > MAX_DATA_CHARS ? `${json.slice(0, MAX_DATA_CHARS)}…` : json;
}

export function classifyProviderProbe(input: {
  configured: boolean;
  httpOk: boolean;
  latencyMs: number | null;
}): ProviderProbeVerdict {
  if (!input.configured) return "skipped";
  if (!input.httpOk) return "bad";
  if (input.latencyMs != null && input.latencyMs > GOOD_LATENCY_MS) return "ok";
  return "good";
}

function skipped(type: SmsProviderType, name: string, hint: string): ProviderProbeResult {
  return {
    type,
    name,
    endpoint: "—",
    verdict: "skipped",
    httpStatus: null,
    latencyMs: null,
    latencySec: null,
    data: hint,
    error: null,
  };
}

function fromTimed(input: {
  type: SmsProviderType;
  name: string;
  endpoint: string;
  configured: boolean;
  httpStatus: number | null;
  httpOk: boolean;
  latencyMs: number;
  data: string;
  error: string | null;
}): ProviderProbeResult {
  return {
    type: input.type,
    name: input.name,
    endpoint: input.endpoint,
    verdict: classifyProviderProbe({
      configured: input.configured,
      httpOk: input.httpOk,
      latencyMs: input.latencyMs,
    }),
    httpStatus: input.httpStatus,
    latencyMs: input.latencyMs,
    latencySec: Math.round((input.latencyMs / 1000) * 10) / 10,
    data: input.data,
    error: input.error,
  };
}

function payloadAsRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

async function timedJsonRequest(url: string, init: RequestInit): Promise<TimedRequest & { parsed: unknown }> {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: init.signal ?? AbortSignal.timeout(12_000),
    });
    const latencyMs = Date.now() - started;
    const text = await res.text();
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text.slice(0, 400) || `HTTP ${res.status}`;
    }
    return {
      httpStatus: res.status,
      httpOk: res.ok,
      latencyMs,
      data: sanitizeProbePayload(parsed),
      error: res.ok ? null : `HTTP ${res.status}`,
      parsed,
    };
  } catch (e) {
    return {
      httpStatus: null,
      httpOk: false,
      latencyMs: Date.now() - started,
      data: "—",
      error: e instanceof Error ? e.message : "Request failed",
      parsed: null,
    };
  }
}

async function probeMnotify(): Promise<ProviderProbeResult> {
  const settings = await loadMnotifySettings();
  const apiKey = trimApiKey(settings.apiKey);
  if (!settings.enabled || !apiKey) {
    return skipped("MNOTIFY", "mNotify", "Not configured — add an API key under Admin → Providers.");
  }

  const base = settings.baseUrl.replace(/\/$/, "");
  let last: ProviderProbeResult | null = null;

  for (const path of MNOTIFY_BALANCE_PATHS) {
    const started = Date.now();
    try {
      const res = await mnotifyApiGet(base, path, apiKey);
      const latencyMs = Date.now() - started;
      const text = await res.text();
      let parsed: unknown = text;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text.slice(0, 400) || `HTTP ${res.status}`;
      }
      const record = payloadAsRecord(parsed);
      const status =
        typeof record?.status === "string" ? record.status.toLowerCase() : "";
      const routeMissing =
        res.status === 404 || /could not be found|not found/i.test(String(record?.message ?? ""));
      if (routeMissing) {
        last = fromTimed({
          type: "MNOTIFY",
          name: "mNotify",
          endpoint: `GET ${path}`,
          configured: true,
          httpStatus: res.status,
          httpOk: false,
          latencyMs,
          data: sanitizeProbePayload(parsed),
          error: `HTTP ${res.status}`,
        });
        continue;
      }
      const httpOk =
        res.ok && status !== "error" && status !== "failed" && status !== "failure";
      return fromTimed({
        type: "MNOTIFY",
        name: "mNotify",
        endpoint: `GET ${path}`,
        configured: true,
        httpStatus: res.status,
        httpOk,
        latencyMs,
        data: sanitizeProbePayload(parsed),
        error: httpOk ? null : `HTTP ${res.status}`,
      });
    } catch (e) {
      last = fromTimed({
        type: "MNOTIFY",
        name: "mNotify",
        endpoint: `GET ${path}`,
        configured: true,
        httpStatus: null,
        httpOk: false,
        latencyMs: Date.now() - started,
        data: "—",
        error: e instanceof Error ? e.message : "Request failed",
      });
    }
  }

  return (
    last ??
    skipped("MNOTIFY", "mNotify", "No response from mNotify balance endpoints.")
  );
}

async function probeTwilio(): Promise<ProviderProbeResult> {
  const twilio = await loadTwilioSettings();
  const sid = twilio.accountSid;
  const token = twilio.authToken;
  if (!twilio.enabled || !sid || !token) {
    return skipped("TWILIO", "Twilio", "Not configured — set account SID and auth token.");
  }

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const timed = await timedJsonRequest(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Balance.json`,
    {
      headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
    },
  );
  return fromTimed({
    type: "TWILIO",
    name: "Twilio",
    endpoint: "GET /2010-04-01/Accounts/{sid}/Balance.json",
    configured: true,
    httpStatus: timed.httpStatus,
    httpOk: timed.httpOk,
    latencyMs: timed.latencyMs,
    data: timed.data,
    error: timed.error,
  });
}

async function probeInfobip(): Promise<ProviderProbeResult> {
  const infobip = await loadInfobipSettings();
  const apiKey = infobip.apiKey;
  const baseUrl = infobip.baseUrl.replace(/\/$/, "") || "https://api.infobip.com";
  if (!infobip.enabled || !apiKey) {
    return skipped("INFOBIP", "Infobip", "Not configured — add an API key under Admin → Providers.");
  }

  const timed = await timedJsonRequest(`${baseUrl}/account/1/balance`, {
    headers: { Authorization: `App ${apiKey}`, Accept: "application/json" },
  });
  const record = payloadAsRecord(timed.parsed);
  const requestError =
    record?.requestError && typeof record.requestError === "object"
      ? (record.requestError as { serviceException?: { text?: string } }).serviceException?.text
      : null;
  const httpOk = timed.httpOk && !requestError;
  return fromTimed({
    type: "INFOBIP",
    name: "Infobip",
    endpoint: "GET /account/1/balance",
    configured: true,
    httpStatus: timed.httpStatus,
    httpOk,
    latencyMs: timed.latencyMs,
    data: timed.data,
    error: httpOk ? null : requestError ?? timed.error,
  });
}

async function probeEasySendSms(): Promise<ProviderProbeResult> {
  const cfg = await loadEasySendSmsSettings();
  if (!cfg.enabled || !cfg.apiKey) {
    return skipped(
      "EASYSENDSMS",
      "EasySendSMS",
      "Not configured — add an API key under Admin → Providers.",
    );
  }

  const timed = await timedJsonRequest("https://restapi.easysendsms.app/v1/rest/sms/balance", {
    method: "POST",
    headers: {
      apikey: cfg.apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  const record = payloadAsRecord(timed.parsed);
  const balanceOk = typeof record?.balance === "number" || typeof record?.balance === "string";
  const httpOk = timed.httpOk && balanceOk;
  const description = typeof record?.description === "string" ? record.description : null;
  return fromTimed({
    type: "EASYSENDSMS",
    name: "EasySendSMS",
    endpoint: "POST /v1/rest/sms/balance",
    configured: true,
    httpStatus: timed.httpStatus,
    httpOk,
    latencyMs: timed.latencyMs,
    data: timed.data,
    error: httpOk ? null : description ?? timed.error,
  });
}

/** Live API ping for each SMS provider — no phone, no send, no wallet debit. */
export async function probeAllSmsProviders(): Promise<ProviderProbeResult[]> {
  return Promise.all([probeMnotify(), probeTwilio(), probeInfobip(), probeEasySendSms()]);
}
