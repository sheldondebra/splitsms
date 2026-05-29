import { prisma } from "@/lib/db";
import { loadMnotifySettings } from "@/lib/mnotify-settings";
import { mnotifyApiGet, trimApiKey } from "@/lib/mnotify/internal";

async function getMnotifyBalanceConfig() {
  const s = await loadMnotifySettings();
  return {
    enabled: s.enabled,
    apiKey: trimApiKey(s.apiKey),
    baseUrl: s.baseUrl.replace(/\/$/, ""),
  };
}

async function isMnotifyConfiguredForBalance() {
  const c = await getMnotifyBalanceConfig();
  return c.enabled && Boolean(c.apiKey);
}

export const MNOTIFY_BALANCE_CACHE_KEY = "mnotify_cached_balance";

export type MnotifyBalanceSnapshot = {
  amount: number;
  bonus: number | null;
  currency: string | null;
  at: string;
  source: string;
};

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value.replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function mnotifyPayloadSucceeded(data: Record<string, unknown>, httpOk: boolean): boolean {
  const status = typeof data.status === "string" ? data.status.toLowerCase() : "";
  if (status === "success" || status === "ok") return true;
  if (status === "error" || status === "failed" || status === "failure") return false;
  return httpOk;
}

const BALANCE_KEYS = new Set([
  "balance",
  "credit",
  "sms_balance",
  "acc_balance",
  "wallet_balance",
  "main_balance",
  "remaining_balance",
  "sms_credit",
  "available_balance",
  "available_credit",
  "credit_balance",
]);

/** Walk mNotify JSON for balance / bonus / currency (shape varies by endpoint). */
export function extractBalanceFromMnotifyPayload(data: unknown): {
  amount: number | null;
  bonus: number | null;
  currency: string | null;
} {
  if (!data || typeof data !== "object") {
    return { amount: null, bonus: null, currency: null };
  }

  let amount: number | null = null;
  let bonus: number | null = null;
  let currency: string | null = null;
  const visited = new Set<object>();

  function walk(obj: Record<string, unknown>, depth: number) {
    if (depth > 8 || visited.has(obj)) return;
    visited.add(obj);

    for (const [key, value] of Object.entries(obj)) {
      const k = key.toLowerCase();
      if (BALANCE_KEYS.has(k)) {
        const n = parseNumber(value);
        if (n != null && amount == null) amount = n;
      }
      if (k === "bonus" || k === "bonus_balance") {
        const n = parseNumber(value);
        if (n != null) bonus = n;
      }
      if (k === "currency" && typeof value === "string" && value.trim()) {
        currency = value.trim();
      }
      if (value && typeof value === "object" && !Array.isArray(value)) {
        walk(value as Record<string, unknown>, depth + 1);
      }
    }
  }

  walk(data as Record<string, unknown>, 0);
  return { amount, bonus, currency };
}

export async function saveMnotifyBalanceCache(
  snapshot: Omit<MnotifyBalanceSnapshot, "at"> & { at?: string },
) {
  const value: MnotifyBalanceSnapshot = {
    amount: snapshot.amount,
    bonus: snapshot.bonus ?? null,
    currency: snapshot.currency ?? "GHS",
    source: snapshot.source,
    at: snapshot.at ?? new Date().toISOString(),
  };
  await prisma.platformSetting.upsert({
    where: { key: MNOTIFY_BALANCE_CACHE_KEY },
    update: { value },
    create: { key: MNOTIFY_BALANCE_CACHE_KEY, value },
  });
  return value;
}

export async function loadMnotifyBalanceCache(): Promise<MnotifyBalanceSnapshot | null> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: MNOTIFY_BALANCE_CACHE_KEY },
  });
  if (!row?.value || typeof row.value !== "object") return null;
  const v = row.value as MnotifyBalanceSnapshot;
  if (typeof v.amount !== "number" || !Number.isFinite(v.amount)) return null;
  return v;
}

/** Try balance from SMS send / campaign response `summary` or root payload. */
export function cacheBalanceFromMnotifyResponse(
  data: unknown,
  source: string,
): MnotifyBalanceSnapshot | null {
  const root = extractBalanceFromMnotifyPayload(data);
  const summary =
    data && typeof data === "object" && "summary" in data
      ? extractBalanceFromMnotifyPayload((data as { summary: unknown }).summary)
      : { amount: null, bonus: null, currency: null };

  const amount = root.amount ?? summary.amount;
  if (amount == null) return null;

  return {
    amount,
    bonus: root.bonus ?? summary.bonus,
    currency: root.currency ?? summary.currency ?? "GHS",
    at: new Date().toISOString(),
    source,
  };
}

function balanceBaseUrls(baseUrl: string): string[] {
  const root = baseUrl.replace(/\/$/, "");
  const urls = new Set<string>([root]);
  if (!root.endsWith("/api")) urls.add(`${root}/api`);
  if (root.endsWith("/api")) urls.add(root.replace(/\/api$/, ""));
  return [...urls];
}

/** Official mNotify SDK (v3): GET {baseUrl}/balance/sms with baseUrl https://api.mnotify.com/api */
const BALANCE_PATHS = ["/api/balance/sms", "/balance/sms"];

function isRouteNotFoundError(message: string) {
  return /could not be found|not found|404/i.test(message);
}

/** Live mNotify wallet / SMS credit balance (tries multiple known endpoints). */
export async function fetchMnotifyAccountBalance(): Promise<{
  ok: boolean;
  amount: number | null;
  bonus: number | null;
  currency: string | null;
  error?: string;
  source?: string;
}> {
  if (!(await isMnotifyConfiguredForBalance())) {
    return {
      ok: false,
      amount: null,
      bonus: null,
      currency: null,
      error: "mNotify not configured",
    };
  }

  const config = await getMnotifyBalanceConfig();
  const apiKey = trimApiKey(config.apiKey);
  let lastError =
    "Could not load balance from mNotify. Send a test SMS or check your wallet on mNotify BMS.";

  for (const base of balanceBaseUrls(config.baseUrl)) {
    for (const path of BALANCE_PATHS) {
      try {
        const res = await mnotifyApiGet(base, path, apiKey);

        const text = await res.text();
        let data: Record<string, unknown> = {};
        try {
          data = JSON.parse(text) as Record<string, unknown>;
        } catch {
          if (res.status === 404) continue;
          lastError = `Non-JSON response from ${path}`;
          continue;
        }

        if (res.status === 401) {
          return {
            ok: false,
            amount: null,
            bonus: null,
            currency: null,
            error: "API key rejected (401)",
          };
        }

        if (res.status === 404 || isRouteNotFoundError(String(data.message ?? ""))) {
          continue;
        }

        if (!mnotifyPayloadSucceeded(data, res.ok)) {
          const msg =
            (typeof data.message === "string" && data.message) ||
            (typeof data.status === "string" && data.status) ||
            `HTTP ${res.status}`;
          if (!isRouteNotFoundError(msg)) lastError = msg;
          continue;
        }

        const { amount, bonus, currency } = extractBalanceFromMnotifyPayload(data);
        if (amount != null) {
          await saveMnotifyBalanceCache({
            amount,
            bonus,
            currency: currency ?? "GHS",
            source: `GET ${path}`,
          });
          return {
            ok: true,
            amount,
            bonus,
            currency: currency ?? "GHS",
            source: `GET ${path}`,
          };
        }

        lastError = "Success response but no balance field found";
      } catch (e) {
        lastError = e instanceof Error ? e.message : "Request failed";
      }
    }
  }

  const cached = await loadMnotifyBalanceCache();
  if (cached) {
    return {
      ok: true,
      amount: cached.amount,
      bonus: cached.bonus,
      currency: cached.currency,
      source: `Cached (${cached.source})`,
      error: lastError,
    };
  }

  return {
    ok: false,
    amount: null,
    bonus: null,
    currency: null,
    error: lastError,
  };
}
