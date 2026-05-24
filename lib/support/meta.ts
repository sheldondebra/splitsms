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
  if (upper === "CLOSED" || upper === "RESOLVED") {
    return {
      label: upper === "RESOLVED" ? "Resolved" : "Closed",
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      icon: CheckCircle2,
    };
  }
  return {
    label: status,
    className: "border-border text-muted-foreground",
    icon: MessageSquare,
  };
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
