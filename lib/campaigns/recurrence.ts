import type { CampaignRecurrence } from "@/lib/generated/prisma/client";

export function computeNextScheduledAt(
  from: Date,
  recurrence: CampaignRecurrence,
  recurrenceDays?: number | null,
): Date | null {
  const next = new Date(from);
  switch (recurrence) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "CUSTOM_DAYS": {
      const days = recurrenceDays && recurrenceDays > 0 ? recurrenceDays : 7;
      next.setDate(next.getDate() + days);
      break;
    }
    default:
      return null;
  }
  return next;
}

export function shouldScheduleRecurrence(
  recurrence: CampaignRecurrence,
  recurrenceEndAt: Date | null | undefined,
  nextAt: Date,
): boolean {
  if (recurrence === "NONE") return false;
  if (recurrenceEndAt && nextAt > recurrenceEndAt) return false;
  return true;
}
