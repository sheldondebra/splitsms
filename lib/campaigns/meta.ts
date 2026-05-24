import {
  Calendar,
  CheckCircle2,
  Clock,
  FileEdit,
  Loader2,
  Pause,
  Send,
  XCircle,
  type LucideIcon,
} from "lucide-react";

export type CampaignStatusKey =
  | "DRAFT"
  | "SCHEDULED"
  | "SENDING"
  | "COMPLETED"
  | "CANCELLED"
  | "PAUSED";

export type CampaignStatusMeta = {
  label: string;
  icon: LucideIcon;
  badgeClass: string;
};

export const CAMPAIGN_STATUS_META: Record<string, CampaignStatusMeta> = {
  DRAFT: {
    label: "Draft",
    icon: FileEdit,
    badgeClass: "border-muted-foreground/30 text-muted-foreground",
  },
  SCHEDULED: {
    label: "Scheduled",
    icon: Calendar,
    badgeClass: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  PAUSED: {
    label: "Paused",
    icon: Pause,
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  SENDING: {
    label: "Sending",
    icon: Loader2,
    badgeClass: "border-primary/30 bg-primary/10 text-primary",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    badgeClass: "border-destructive/30 bg-destructive/10 text-destructive",
  },
};

export type CampaignFilter = "all" | CampaignStatusKey;

export const CAMPAIGN_FILTER_OPTIONS: { value: CampaignFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "SENDING", label: "Sending" },
  { value: "PAUSED", label: "Paused" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "DRAFT", label: "Draft" },
];

export const RECURRENCE_LABELS: Record<string, string> = {
  NONE: "",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  CUSTOM_DAYS: "Custom interval",
};

export function getCampaignStatusMeta(status: string): CampaignStatusMeta {
  return (
    CAMPAIGN_STATUS_META[status] ?? {
      label: status.replace(/_/g, " ").toLowerCase(),
      icon: Send,
      badgeClass: "border-border text-muted-foreground",
    }
  );
}

export function computeDeliveryRate(stats: {
  total: number;
  delivered: number;
  sent: number;
}) {
  if (stats.total <= 0) return 0;
  return Math.round(((stats.delivered + stats.sent) / stats.total) * 100);
}

export function formatCampaignWhen(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
