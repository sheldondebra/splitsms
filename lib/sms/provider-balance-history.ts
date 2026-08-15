import { prisma } from "@/lib/db";
import type { SmsProviderType } from "@/lib/generated/prisma/client";
import type { ProviderBalanceStatus, ProviderSmsBalance } from "@/lib/sms/provider-balances";

export const PROVIDER_BALANCE_HISTORY_KEY = "provider_balance_history";
const MAX_ENTRIES = 300;

export type ProviderBalanceHistorySource =
  | "manual"
  | "refresh-all"
  | "system-sync"
  | "alert-check";

export type ProviderBalanceHistoryEntry = {
  id: string;
  type: SmsProviderType;
  name: string;
  status: ProviderBalanceStatus;
  display: string;
  amount: number | null;
  currency: string | null;
  bonus: number | null;
  error?: string;
  at: string;
  source: ProviderBalanceHistorySource;
};

function isEntry(value: unknown): value is ProviderBalanceHistoryEntry {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.type === "string" &&
    typeof row.name === "string" &&
    typeof row.status === "string" &&
    typeof row.display === "string" &&
    typeof row.at === "string" &&
    typeof row.source === "string"
  );
}

export async function loadProviderBalanceHistory(): Promise<ProviderBalanceHistoryEntry[]> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: PROVIDER_BALANCE_HISTORY_KEY },
  });
  if (!row?.value || typeof row.value !== "object") return [];
  const raw = row.value as { entries?: unknown };
  if (!Array.isArray(raw.entries)) return [];
  return raw.entries.filter(isEntry);
}

export async function recordProviderBalances(
  balances: ProviderSmsBalance[],
  source: ProviderBalanceHistorySource,
): Promise<ProviderBalanceHistoryEntry[]> {
  if (balances.length === 0) return loadProviderBalanceHistory();

  const at = new Date().toISOString();
  const nextEntries: ProviderBalanceHistoryEntry[] = balances.map((b) => ({
    id: `${b.type}-${at}-${Math.random().toString(36).slice(2, 8)}`,
    type: b.type,
    name: b.name,
    status: b.status,
    display: b.display,
    amount: b.amount,
    currency: b.currency,
    bonus: b.bonus,
    error: b.error,
    at,
    source,
  }));

  const existing = await loadProviderBalanceHistory();
  const merged = [...nextEntries, ...existing].slice(0, MAX_ENTRIES);

  await prisma.platformSetting.upsert({
    where: { key: PROVIDER_BALANCE_HISTORY_KEY },
    update: { value: { entries: merged } },
    create: { key: PROVIDER_BALANCE_HISTORY_KEY, value: { entries: merged } },
  });

  return merged;
}

export async function getProviderBalanceHistory(filters?: {
  type?: SmsProviderType | "all";
  limit?: number;
}): Promise<ProviderBalanceHistoryEntry[]> {
  const all = await loadProviderBalanceHistory();
  const type = filters?.type && filters.type !== "all" ? filters.type : null;
  const filtered = type ? all.filter((e) => e.type === type) : all;
  const limit = Math.min(Math.max(filters?.limit ?? 100, 1), MAX_ENTRIES);
  return filtered.slice(0, limit);
}
