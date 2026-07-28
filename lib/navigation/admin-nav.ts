import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Store,
  Building2,
  CreditCard,
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
  MessagesSquare,
  UserCog,
  History,
  ArrowLeftRight,
  SlidersHorizontal,
  TicketPercent,
  Banknote,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?:
    | "pending-payments"
    | "pending-sender-ids"
    | "open-support-tickets"
    | "operations-attention"
    | "pending-reseller-payouts";
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
      { href: "/admin/general", label: "Settings", icon: Settings },
    ],
  },
  {
    id: "users",
    label: "Users",
    items: [
      { href: "/admin/members", label: "Members", icon: Users },
      { href: "/admin/staff", label: "Staff & roles", icon: UserCog },
      { href: "/admin/activity", label: "Activity logs", icon: History },
      { href: "/admin/outreach", label: "Bulk messages", icon: MessagesSquare },
      { href: "/admin/resellers", label: "Resellers", icon: Store },
      {
        href: "/admin/reseller-payouts",
        label: "Reseller payouts",
        icon: Banknote,
        badge: "pending-reseller-payouts",
      },
      { href: "/admin/enterprise", label: "Enterprise", icon: Building2 },
    ],
  },
  {
    id: "revenue",
    label: "Revenue",
    items: [
      { href: "/admin/payments", label: "Payments", icon: CreditCard, badge: "pending-payments" },
      { href: "/admin/payments/transactions", label: "Provider transactions", icon: ArrowLeftRight },
      { href: "/admin/payments/settings", label: "Payment settings", icon: SlidersHorizontal },
      { href: "/admin/billing", label: "Billing & promos", icon: TicketPercent },
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
  if (pathname === "/admin/payments/transactions") return "Provider transactions";
  if (pathname === "/admin/payments/settings") return "Payment settings";
  if (pathname === "/admin/reseller-payouts") return "Reseller payouts";
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
  if (pathname === href) return true;
  if (href === "/admin") return false;
  const exactNavMatch = adminNavSections.some((section) =>
    section.items.some((item) => item.href === pathname),
  );
  if (exactNavMatch) return false;
  return pathname.startsWith(`${href}/`);
}
