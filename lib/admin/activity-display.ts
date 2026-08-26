import { formatAccountNumber } from "@/lib/auth/account-number";

const CUID_RE = /^c[a-z0-9]{20,32}$/i;

const META_KEY_LABELS: Record<string, string> = {
  realUserId: "user",
  userId: "user",
  actorId: "user",
  targetUserId: "user",
  impersonatorId: "impersonator",
};

export function looksLikeCuid(value: string) {
  return CUID_RE.test(value);
}

export function collectPossibleUserIds(logs: Array<{
  entityId: string | null;
  actor: { id: string } | null;
  metadata: unknown;
}>): string[] {
  const ids = new Set<string>();
  for (const log of logs) {
    if (log.actor?.id) ids.add(log.actor.id);
    if (log.entityId && looksLikeCuid(log.entityId)) ids.add(log.entityId);
    if (!log.metadata || typeof log.metadata !== "object") continue;
    for (const value of Object.values(log.metadata as Record<string, unknown>)) {
      if (typeof value === "string" && looksLikeCuid(value)) ids.add(value);
    }
  }
  return [...ids];
}

export function displayAccountId(
  id: string | null | undefined,
  accountIds: Record<string, string>,
) {
  if (!id) return null;
  return accountIds[id] ?? id;
}

export function formatActivityMetadata(
  metadata: unknown,
  accountIds: Record<string, string>,
) {
  if (!metadata || typeof metadata !== "object") return null;
  const entries = Object.entries(metadata as Record<string, unknown>).slice(0, 4);
  if (entries.length === 0) return null;
  return entries
    .map(([key, value]) => {
      const label = META_KEY_LABELS[key] ?? key;
      let display: string;
      if (typeof value === "string" && accountIds[value]) {
        display = accountIds[value];
      } else if (typeof value === "string") {
        display = value;
      } else {
        display = JSON.stringify(value);
      }
      return `${label}: ${display}`;
    })
    .join(" · ");
}

export function accountIdMapFromUsers(
  users: Array<{ id: string; accountNumber: number | null }>,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const user of users) {
    if (user.accountNumber == null) continue;
    map[user.id] = formatAccountNumber(user.accountNumber);
  }
  return map;
}
