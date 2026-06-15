import type { LucideIcon } from "lucide-react";
import {
  Home,
  Send,
  BadgeCheck,
  Users,
  Megaphone,
  FileStack,
  FileText,
  Wallet,
  BarChart3,
  DollarSign,
  ScrollText,
  Workflow,
  Key,
  Code2,
  Settings,
  LifeBuoy,
  Receipt,
  Puzzle,
  Link2,
} from "lucide-react";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shown in mobile bottom bar */
  mobile?: boolean;
};

export type DashboardNavCategory = {
  id: string;
  label: string;
  items: DashboardNavItem[];
};

export const dashboardNavCategories: DashboardNavCategory[] = [
  {
    id: "overview",
    label: "Overview",
    items: [{ href: "/dashboard", label: "Home", icon: Home, mobile: true }],
  },
  {
    id: "messaging",
    label: "Messaging",
    items: [
      { href: "/dashboard/send", label: "Send SMS", icon: Send, mobile: true },
      { href: "/dashboard/sender-ids", label: "Sender ID", icon: BadgeCheck, mobile: true },
      { href: "/dashboard/contacts", label: "Contacts", icon: Users },
      { href: "/dashboard/forms", label: "Smart Forms", icon: FileText },
      { href: "/dashboard/campaigns", label: "Campaigns", icon: Megaphone },
      { href: "/dashboard/templates", label: "Templates", icon: FileStack },
    ],
  },
  {
    id: "billing",
    label: "Money & reports",
    items: [
      { href: "/dashboard/wallet", label: "Wallet", icon: Wallet, mobile: true },
      { href: "/dashboard/reports", label: "Message results", icon: BarChart3 },
      { href: "/dashboard/pricing", label: "Pricing", icon: DollarSign },
      { href: "/dashboard/transactions", label: "Transactions", icon: ScrollText },
      { href: "/dashboard/invoices", label: "Invoices", icon: Receipt },
    ],
  },
  {
    id: "tools",
    label: "Tools & API",
    items: [
      { href: "/dashboard/connect", label: "Connect", icon: Link2 },
      { href: "/dashboard/automation", label: "Automation", icon: Workflow },
      { href: "/dashboard/api-keys", label: "App connections", icon: Key },
      { href: "/dashboard/integrations/wordpress", label: "WordPress", icon: Puzzle },
      { href: "/developers", label: "Developers", icon: Code2 },
    ],
  },
  {
    id: "account",
    label: "Account",
    items: [
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
      { href: "/dashboard/support", label: "Help & support", icon: LifeBuoy },
    ],
  },
];

export const mobileNavItems = dashboardNavCategories
  .flatMap((c) => c.items)
  .filter((item) => item.mobile);

export function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
