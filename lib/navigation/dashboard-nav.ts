import type { LucideIcon } from "lucide-react";
import {
  isFeatureEnabledIn,
  type PlatformFeatureFlags,
  type PlatformFeatureId,
} from "@/lib/platform/feature-catalog";
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
  FileBarChart2,
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
  /** Hide this item when the platform feature is off. */
  feature?: PlatformFeatureId;
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
      { href: "/dashboard/send", label: "Send SMS", icon: Send, mobile: true, feature: "sms" },
      { href: "/dashboard/sender-ids", label: "Sender ID", icon: BadgeCheck },
      { href: "/dashboard/contacts", label: "Contacts", icon: Users, feature: "contacts" },
      { href: "/dashboard/forms", label: "Smart Forms", icon: FileText, mobile: true, feature: "smart_forms" },
      { href: "/dashboard/campaigns", label: "Campaigns", icon: Megaphone, feature: "bulk_sms" },
      { href: "/dashboard/wallet", label: "Wallet", icon: Wallet, mobile: true },
    ],
  },
  {
    id: "more",
    label: "More",
    collapsible: true,
    defaultOpen: false,
    items: [
      { href: "/dashboard/templates", label: "Templates", icon: FileStack, feature: "templates" },
      { href: "/dashboard/reports", label: "Message results", icon: BarChart3, feature: "reports" },
      { href: "/dashboard/account-reports", label: "My reports", icon: FileBarChart2, feature: "account_reports" },
      { href: "/dashboard/transactions", label: "Transactions", icon: ScrollText, feature: "transactions" },
      { href: "/dashboard/invoices", label: "Invoices", icon: Receipt, feature: "invoices" },
      { href: "/dashboard/pricing", label: "Pricing", icon: DollarSign, feature: "pricing" },
      { href: "/dashboard/connect", label: "Connect", icon: Link2, feature: "connect" },
      { href: "/dashboard/automation", label: "Automation", icon: Workflow, feature: "automation" },
      { href: "/dashboard/api-keys", label: "App connections", icon: Key, feature: "api_keys" },
      { href: "/dashboard/integrations/google", label: "Google", icon: Link2, feature: "google" },
      { href: "/dashboard/integrations/google/forms", label: "Google Forms SMS", icon: FileText, feature: "google_forms" },
      { href: "/dashboard/integrations/wordpress", label: "WordPress", icon: Puzzle, feature: "wordpress" },
      { href: "/developers", label: "Developers", icon: Code2, feature: "developers" },
    ],
  },
  {
    id: "account",
    label: "Account",
    defaultOpen: true,
    items: [
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
      { href: "/dashboard/support", label: "Help & support", icon: LifeBuoy, feature: "support" },
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

const dashboardNavHrefs = dashboardNavSections.flatMap((section) =>
  section.items.map((item) => item.href),
);

function navHrefMatches(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isNavActive(pathname: string, href: string) {
  if (!navHrefMatches(pathname, href)) return false;
  return !dashboardNavHrefs.some(
    (other) => other !== href && other.length > href.length && navHrefMatches(pathname, other),
  );
}

export function filterDashboardNavSections(
  sections: DashboardNavSection[],
  flags: PlatformFeatureFlags,
): DashboardNavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.feature || isFeatureEnabledIn(flags, item.feature),
      ),
    }))
    .filter((section) => section.items.length > 0);
}
