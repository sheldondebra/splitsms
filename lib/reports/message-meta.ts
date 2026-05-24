import {
  CheckCircle2,
  Clock,
  HelpCircle,
  Send,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { STATUS_LABELS } from "@/lib/ux/messages";

export type MessageStatusMeta = {
  label: string;
  icon: LucideIcon;
  badgeClass: string;
  textClass: string;
};

export const MESSAGE_STATUS_META: Record<string, MessageStatusMeta> = {
  PENDING: {
    label: STATUS_LABELS.PENDING,
    icon: Clock,
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    textClass: "text-amber-700 dark:text-amber-400",
  },
  SENT: {
    label: STATUS_LABELS.SENT,
    icon: Send,
    badgeClass: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    textClass: "text-blue-700 dark:text-blue-400",
  },
  DELIVERED: {
    label: STATUS_LABELS.DELIVERED,
    icon: CheckCircle2,
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    textClass: "text-emerald-600 dark:text-emerald-400",
  },
  FAILED: {
    label: STATUS_LABELS.FAILED,
    icon: XCircle,
    badgeClass: "border-destructive/30 bg-destructive/10 text-destructive",
    textClass: "text-destructive",
  },
  REJECTED: {
    label: STATUS_LABELS.REJECTED,
    icon: XCircle,
    badgeClass: "border-destructive/30 bg-destructive/10 text-destructive",
    textClass: "text-destructive",
  },
  EXPIRED: {
    label: STATUS_LABELS.EXPIRED,
    icon: HelpCircle,
    badgeClass: "border-muted-foreground/30 bg-muted text-muted-foreground",
    textClass: "text-muted-foreground",
  },
};

export type MessageStatusFilter = "all" | "PENDING" | "SENT" | "DELIVERED" | "FAILED";

export const MESSAGE_FILTER_OPTIONS: { value: MessageStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "SENT", label: "On the way" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
];

export function getMessageStatusMeta(status: string): MessageStatusMeta {
  return (
    MESSAGE_STATUS_META[status] ?? {
      label: STATUS_LABELS[status] ?? status,
      icon: HelpCircle,
      badgeClass: "border-border text-muted-foreground",
      textClass: "text-muted-foreground",
    }
  );
}

export function formatReportWhen(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function buildReportsQuery(
  current: Record<string, string | undefined>,
  patch: Record<string, string | undefined | null>,
) {
  const next = new URLSearchParams();
  const merged = { ...current, ...patch };
  for (const [key, value] of Object.entries(merged)) {
    if (value == null || value === "" || value === "all") continue;
    next.set(key, value);
  }
  const qs = next.toString();
  return qs ? `/dashboard/reports?${qs}` : "/dashboard/reports";
}
