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
  Layers3,
  ScrollText,
  BarChart3,
  ShieldAlert,
  Settings,
  FileText,
  Megaphone,
  LifeBuoy,
  Activity,
  Send,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: "pending-payments" | "pending-sender-ids" | "open-support-tickets" | "operations-attention";
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
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/operations", label: "Operations", icon: Activity, badge: "operations-attention" },
      { href: "/admin/general", label: "General office", icon: Settings },
    ],
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
      { href: "/admin/payments/settings", label: "Payment settings", icon: CreditCard },
      { href: "/admin/billing", label: "Billing & promos", icon: Receipt },
      { href: "/admin/pricing", label: "SMS pricing", icon: DollarSign },
    ],
  },
  {
    id: "sms",
    label: "SMS platform",
    items: [
      { href: "/admin/sender-ids", label: "Sender IDs", icon: BadgeCheck, badge: "pending-sender-ids" },
      { href: "/admin/messages", label: "SMS logs", icon: Send },
      { href: "/admin/routes", label: "Routes", icon: Route },
      { href: "/admin/providers", label: "Providers", icon: Layers3 },
    ],
  },
  {
    id: "products",
    label: "Products",
    items: [
      { href: "/admin/forms", label: "Smart Forms", icon: FileText },
      { href: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
      { href: "/admin/support", label: "Support", icon: LifeBuoy, badge: "open-support-tickets" },
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
  if (pathname === "/admin/mnotify" || pathname.startsWith("/admin/mnotify/"))
    return "Providers";
  if (/^\/admin\/members\/[^/]+$/.test(pathname)) return "Member detail";
  if (/^\/admin\/resellers\/[^/]+$/.test(pathname)) return "Reseller detail";
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
