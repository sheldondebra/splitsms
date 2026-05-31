/** Extended mNotify sender ID API (list attempts, delete attempts). */

import { getMnotifyConfig } from "@/lib/mnotify";
import { buildMnotifyUrl, mnotifyApiGet, trimApiKey } from "@/lib/mnotify/internal";

export type MnotifySenderIdRecord = {
  senderName: string;
  purpose: string | null;
  status: string | null;
  raw?: unknown;
};

export type MnotifySenderIdListResult =
  | { ok: true; items: MnotifySenderIdRecord[]; source: "api" | "discovered" }
  | { ok: false; error: string };

function normalizeSenderRecord(raw: Record<string, unknown>): MnotifySenderIdRecord | null {
  const senderName = String(
    raw.sender_name ??
      raw.senderName ??
      raw["sender name"] ??
      raw.name ??
      raw.sender ??
      "",
  ).trim();
  if (!senderName) return null;

  const purpose =
    typeof raw.purpose === "string"
      ? raw.purpose
      : Array.isArray(raw.purpose)
        ? raw.purpose.join(", ")
        : null;

  const status =
    typeof raw.status === "string"
      ? raw.status
      : typeof raw.approval_status === "string"
        ? raw.approval_status
        : null;

  return { senderName, purpose, status, raw };
}

function extractListFromPayload(data: unknown): MnotifySenderIdRecord[] {
  if (!data || typeof data !== "object") return [];

  const obj = data as Record<string, unknown>;
  const candidates: unknown[] = [];

  if (Array.isArray(obj)) candidates.push(...obj);
  if (Array.isArray(obj.sender_list)) candidates.push(...obj.sender_list);
  if (Array.isArray(obj.sender_ids)) candidates.push(...obj.sender_ids);
  if (Array.isArray(obj.senderid_list)) candidates.push(...obj.senderid_list);
  if (Array.isArray(obj.data)) candidates.push(...obj.data);
  if (Array.isArray(obj.summary)) candidates.push(...obj.summary);
  if (obj.summary && typeof obj.summary === "object" && !Array.isArray(obj.summary)) {
    candidates.push(obj.summary);
  }

  const items: MnotifySenderIdRecord[] = [];
  const seen = new Set<string>();

  for (const entry of candidates) {
    if (!entry || typeof entry !== "object") continue;
    const row = normalizeSenderRecord(entry as Record<string, unknown>);
    if (!row || seen.has(row.senderName.toUpperCase())) continue;
    seen.add(row.senderName.toUpperCase());
    items.push(row);
  }

  return items;
}

/** Try documented and common list endpoints; mNotify v2 often has no list API. */
export async function fetchMnotifySenderIdListFromApi(): Promise<MnotifySenderIdListResult> {
  const config = await getMnotifyConfig();
  if (!config.enabled || !config.apiKey) {
    return { ok: false, error: "mNotify is not configured" };
  }

  const apiKey = trimApiKey(config.apiKey);
  const baseUrl = config.baseUrl.replace(/\/$/, "");

  const attempts: { method: "GET" | "POST"; path: string; body?: unknown }[] = [
    { method: "GET", path: "/api/senderid/list" },
    { method: "GET", path: "/api/senderid" },
    { method: "POST", path: "/api/senderid/list", body: {} },
    { method: "POST", path: "/api/senderid/all", body: {} },
  ];

  for (const attempt of attempts) {
    try {
      let res: Response;
      if (attempt.method === "GET") {
        res = await mnotifyApiGet(baseUrl, attempt.path, apiKey);
      } else {
        const url = buildMnotifyUrl(baseUrl, attempt.path, apiKey);
        res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: apiKey,
          },
          body: JSON.stringify(attempt.body ?? {}),
          cache: "no-store",
        });
      }

      const data = (await res.json()) as Record<string, unknown>;
      if (!res.ok) continue;

      const items = extractListFromPayload(data);
      if (items.length > 0) {
        return { ok: true, items, source: "api" };
      }

      const status = String(data.status ?? "").toLowerCase();
      if (status === "success") {
        return { ok: true, items: [], source: "api" };
      }
    } catch {
      // try next endpoint
    }
  }

  return {
    ok: false,
    error:
      "mNotify does not expose a sender ID list endpoint — inventory is built from status checks on known names.",
  };
}

export async function deleteMnotifySenderId(senderName: string) {
  const config = await getMnotifyConfig();
  if (!config.enabled || !config.apiKey) {
    return { ok: false as const, error: "mNotify is not configured" };
  }

  const apiKey = trimApiKey(config.apiKey);
  const baseUrl = config.baseUrl.replace(/\/$/, "");
  const encoded = encodeURIComponent(senderName.trim());

  const attempts: { method: "DELETE" | "POST"; path: string; body?: unknown }[] = [
    { method: "DELETE", path: `/api/senderid/${encoded}` },
    { method: "DELETE", path: `/api/senderid/delete/${encoded}` },
    { method: "POST", path: "/api/senderid/delete", body: { sender_name: senderName.trim() } },
  ];

  for (const attempt of attempts) {
    try {
      const url = buildMnotifyUrl(baseUrl, attempt.path, apiKey);
      const res = await fetch(url, {
        method: attempt.method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: apiKey,
        },
        ...(attempt.body ? { body: JSON.stringify(attempt.body) } : {}),
        cache: "no-store",
      });

      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (res.ok) {
        const status = String(data.status ?? "").toLowerCase();
        if (!status || status === "success") {
          return { ok: true as const, message: String(data.message ?? "Deleted at mNotify") };
        }
      }
    } catch {
      // try next
    }
  }

  return {
    ok: false as const,
    error:
      "mNotify API has no documented delete endpoint — remove in mNotify BMS if needed. SplitSMS records can still be removed.",
  };
}

export async function updateMnotifySenderIdPurpose(senderName: string, purpose: string) {
  const { registerMnotifySenderId } = await import("@/lib/mnotify");
  return registerMnotifySenderId(senderName.trim(), purpose.trim());
}
