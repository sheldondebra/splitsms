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
  Mail,
} from "lucide-react";

import type { AdminPermission } from "@/lib/auth/admin-permissions";

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
  /** Omit = all admin roles. Super Admin always sees every item. */
  permission?: AdminPermission | readonly AdminPermission[];
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
      { href: "/admin/operations", label: "Operations", icon: Activity, badge: "operations-attention", permission: "operations.read" },
      { href: "/admin/general", label: "Settings", icon: Settings, permission: "settings.read" },
    ],
  },
  {
    id: "users",
    label: "Users",
    items: [
      { href: "/admin/members", label: "Members", icon: Users, permission: "members.read" },
      { href: "/admin/staff", label: "Staff & roles", icon: UserCog, permission: ["staff.read", "staff.write"] },
      { href: "/admin/activity", label: "Activity logs", icon: History, permission: "activity.read" },
      { href: "/admin/outreach", label: "Bulk messages", icon: MessagesSquare, permission: "members.write" },
      { href: "/admin/email-marketing", label: "Email Marketing", icon: Mail, permission: "members.write" },
      { href: "/admin/resellers", label: "Resellers", icon: Store, permission: "members.read" },
      {
        href: "/admin/reseller-payouts",
        label: "Reseller payouts",
        icon: Banknote,
        badge: "pending-reseller-payouts",
        permission: "payments.read",
      },
      { href: "/admin/enterprise", label: "Enterprise", icon: Building2, permission: "members.read" },
    ],
  },
  {
    id: "revenue",
    label: "Revenue",
    items: [
      { href: "/admin/payments", label: "Payments", icon: CreditCard, badge: "pending-payments", permission: "payments.read" },
      { href: "/admin/payments/transactions", label: "Provider transactions", icon: ArrowLeftRight, permission: "payments.read" },
      { href: "/admin/payments/settings", label: "Payment settings", icon: SlidersHorizontal, permission: "payments.settings" },
      { href: "/admin/billing", label: "Billing & promos", icon: TicketPercent, permission: "payments.write" },
      { href: "/admin/pricing", label: "SMS pricing", icon: DollarSign, permission: "pricing.write" },
    ],
  },
  {
    id: "sms",
    label: "SMS platform",
    items: [
      { href: "/admin/sender-ids", label: "Sender IDs", icon: BadgeCheck, badge: "pending-sender-ids", permission: "sender_ids.read" },
      { href: "/admin/messages", label: "SMS logs", icon: Send, permission: "operations.read" },
      { href: "/admin/routes", label: "Routes", icon: Route, permission: "routes.write" },
      { href: "/admin/providers", label: "Providers", icon: Layers3, permission: "providers.write" },
      { href: "/admin/balances", label: "Balance history", icon: History, permission: "providers.write" },
    ],
  },
  {
    id: "products",
    label: "Products",
    items: [
      { href: "/admin/forms", label: "Smart Forms", icon: FileText, permission: "members.read" },
      { href: "/admin/campaigns", label: "Campaigns", icon: Megaphone, permission: "operations.read" },
      { href: "/admin/support", label: "Support", icon: LifeBuoy, badge: "open-support-tickets", permission: "support.read" },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    items: [
      { href: "/admin/api-logs", label: "API logs", icon: ScrollText, permission: "activity.read" },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3, permission: "activity.read" },
      { href: "/admin/fraud", label: "Fraud", icon: ShieldAlert, permission: "activity.read" },
    ],
  },
];

export function getAdminPageTitle(pathname: string): string {
  if (pathname === "/admin/balances") return "Balance history";
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
