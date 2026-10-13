import type { SenderIdOperationalStatus } from "@/lib/generated/prisma/client";

export type SenderIdRestriction = {
  status: SenderIdOperationalStatus;
  reason: string | null;
  suspendedUntil: Date | null;
};

/** A timed SUSPENDED row whose window has passed is treated as active again — no cron needed. */
export function isRestrictionInEffect(row: SenderIdRestriction | null | undefined): boolean {
  if (!row) return false;
  if (row.status === "ACTIVE") return false;
  if (row.status === "BLOCKED") return true;
  if (!row.suspendedUntil) return true;
  return row.suspendedUntil.getTime() > Date.now();
}

export function describeRestriction(row: SenderIdRestriction): string {
  const reason = row.reason?.trim();
  if (row.status === "BLOCKED") {
    return reason ? `Blocked by admin: ${reason}` : "Blocked by admin";
  }
  const until = row.suspendedUntil
    ? ` until ${row.suspendedUntil.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}`
    : " indefinitely";
  return reason ? `Suspended${until}: ${reason}` : `Suspended${until}`;
}

export const SUSPENSION_DURATION_OPTIONS = [
  { value: "1h", label: "1 hour", hours: 1 },
  { value: "6h", label: "6 hours", hours: 6 },
  { value: "24h", label: "24 hours", hours: 24 },
  { value: "3d", label: "3 days", hours: 72 },
  { value: "7d", label: "7 days", hours: 24 * 7 },
  { value: "30d", label: "30 days", hours: 24 * 30 },
  { value: "indefinite", label: "Indefinite (until manually restored)", hours: null },
] as const;

export function resolveSuspensionDuration(key: string): Date | null {
  const option = SUSPENSION_DURATION_OPTIONS.find((o) => o.value === key);
  if (!option || option.hours == null) return null;
  return new Date(Date.now() + option.hours * 60 * 60 * 1000);
}
