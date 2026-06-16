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
  MoreHorizontal,
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

export type DashboardNavSection = {
  id: string;
  label: string;
  items: DashboardNavItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
};

// Keep the sidebar simple: common actions first, less-used items under "More".
export const dashboardNavSections: DashboardNavSection[] = [
  {
    id: "main",
    label: "Main",
    defaultOpen: true,
    items: [
      { href: "/dashboard", label: "Home", icon: Home, mobile: true },
      { href: "/dashboard/send", label: "Send SMS", icon: Send, mobile: true },
      { href: "/dashboard/contacts", label: "Contacts", icon: Users },
      { href: "/dashboard/forms", label: "Smart Forms", icon: FileText },
      { href: "/dashboard/campaigns", label: "Campaigns", icon: Megaphone },
      { href: "/dashboard/wallet", label: "Wallet", icon: Wallet, mobile: true },
    ],
  },
  {
    id: "more",
    label: "More",
    collapsible: true,
    defaultOpen: false,
    items: [
      { href: "/dashboard/sender-ids", label: "Sender ID", icon: BadgeCheck, mobile: true },
      { href: "/dashboard/templates", label: "Templates", icon: FileStack },
      { href: "/dashboard/reports", label: "Message results", icon: BarChart3 },
      { href: "/dashboard/transactions", label: "Transactions", icon: ScrollText },
      { href: "/dashboard/invoices", label: "Invoices", icon: Receipt },
      { href: "/dashboard/pricing", label: "Pricing", icon: DollarSign },
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
    defaultOpen: true,
    items: [
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
      { href: "/dashboard/support", label: "Help & support", icon: LifeBuoy },
    ],
  },
];

// Backwards export (some older components may still import this name).
export const dashboardNavCategories: DashboardNavCategory[] = dashboardNavSections.map(
  ({ id, label, items }) => ({ id, label, items }),
);

export const mobileNavItems = dashboardNavCategories
  .flatMap((c) => c.items)
  .filter((item) => item.mobile);

export function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
