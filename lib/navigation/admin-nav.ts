import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Store,
  Building2,
  CreditCard,
  Receipt,
  DollarSign,
  BadgeCheck,
  Route,
  Radio,
  ScrollText,
  BarChart3,
  ShieldAlert,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: "pending-payments" | "pending-sender-ids";
};

export type AdminNavSection = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

export const adminNavSections: AdminNavSection[] = [
  {
    id: "main",
    label: "Main",
    items: [{ href: "/admin", label: "Overview", icon: LayoutDashboard }],
  },
  {
    id: "users",
    label: "Users",
    items: [
      { href: "/admin/members", label: "Members", icon: Users },
      { href: "/admin/resellers", label: "Resellers", icon: Store },
      { href: "/admin/enterprise", label: "Enterprise", icon: Building2 },
    ],
  },
  {
    id: "revenue",
    label: "Revenue",
    items: [
      { href: "/admin/payments", label: "Payments", icon: CreditCard, badge: "pending-payments" },
      { href: "/admin/billing", label: "Billing & promos", icon: Receipt },
      { href: "/admin/pricing", label: "SMS pricing", icon: DollarSign },
    ],
  },
  {
    id: "sms",
    label: "SMS platform",
    items: [
      { href: "/admin/sender-ids", label: "Sender IDs", icon: BadgeCheck, badge: "pending-sender-ids" },
      { href: "/admin/routes", label: "Routes", icon: Route },
      { href: "/admin/mnotify", label: "mNotify setup", icon: Radio },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    items: [
      { href: "/admin/api-logs", label: "API logs", icon: ScrollText },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/admin/fraud", label: "Fraud", icon: ShieldAlert },
    ],
  },
];

export function getAdminPageTitle(pathname: string): string {
  for (const section of adminNavSections) {
    for (const item of section.items) {
      if (pathname === item.href) return item.label;
      if (item.href !== "/admin" && pathname.startsWith(item.href)) return item.label;
    }
  }
  return "Admin";
}

export function isAdminNavActive(pathname: string, href: string) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(href));
}
