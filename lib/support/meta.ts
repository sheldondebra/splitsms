import type { LucideIcon } from "lucide-react";
import { Clock, CheckCircle2, MessageSquare } from "lucide-react";

export type TicketStatus = "OPEN" | "CLOSED" | "RESOLVED" | string;

export type TicketStatusMeta = {
  label: string;
  className: string;
  icon: LucideIcon;
};

export function getTicketStatusMeta(status: string): TicketStatusMeta {
  const upper = status.toUpperCase();
  if (upper === "OPEN") {
    return {
      label: "Open",
      className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
      icon: Clock,
    };
  }
  if (upper === "IN_PROGRESS") {
    return {
      label: "Processing",
      className: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
      icon: MessageSquare,
    };
  }
  if (upper === "RESOLVED") {
    return {
      label: "Resolved",
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      icon: CheckCircle2,
    };
  }
  if (upper === "CLOSED") {
    return {
      label: "Closed",
      className: "border-border/60 bg-muted/40 text-muted-foreground",
      icon: CheckCircle2,
    };
  }
  return {
    label: status,
    className: "border-border text-muted-foreground",
    icon: MessageSquare,
  };
}

/** Compact tag for support chat ticket threads. */
export function getChatTicketTag(
  status: string,
  hasStaffReply: boolean,
): TicketStatusMeta {
  const upper = status.toUpperCase();
  if (upper === "CLOSED" || upper === "RESOLVED") {
    return getTicketStatusMeta(upper);
  }
  if (upper === "IN_PROGRESS") {
    return getTicketStatusMeta("IN_PROGRESS");
  }
  if (upper === "OPEN" && hasStaffReply) {
    return {
      label: "Answered",
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      icon: CheckCircle2,
    };
  }
  return getTicketStatusMeta(upper === "OPEN" ? "OPEN" : status);
}

export function isTicketThreadClosed(status: string): boolean {
  const upper = status.toUpperCase();
  return upper === "CLOSED" || upper === "RESOLVED";
}

export const QUICK_TOPICS: { id: string; label: string; draft: string }[] = [
  {
    id: "billing",
    label: "Billing & wallet",
    draft: "Hi, I need help with a wallet top-up or billing on my account.",
  },
  {
    id: "delivery",
    label: "SMS delivery",
    draft: "Hi, some of my messages show as failed or undelivered. Can you help investigate?",
  },
  {
    id: "sender",
    label: "Sender ID",
    draft: "Hi, I submitted a Sender ID and need an update on approval status.",
  },
  {
    id: "api",
    label: "API & integrations",
    draft: "Hi, I need help with the API, webhooks, or a third-party integration.",
  },
  {
    id: "account",
    label: "Account access",
    draft: "Hi, I need help signing in or updating my account details.",
  },
];

export const HELP_LINKS = [
  { href: "/developers/docs", label: "API documentation" },
  { href: "/dashboard/sender-ids", label: "Sender IDs" },
  { href: "/dashboard/wallet", label: "Wallet & top-up" },
  { href: "/dashboard/reports", label: "Delivery reports" },
];
