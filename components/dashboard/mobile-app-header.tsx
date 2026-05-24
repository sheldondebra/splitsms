"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { DashboardBalance } from "@/components/dashboard/dashboard-balance";
import { NotificationBell, type NotificationItem } from "@/components/dashboard/notification-panel";
import type { BalanceSnapshot } from "@/lib/dashboard/balance-snapshot";
import { dashboardNavCategories } from "@/lib/navigation/dashboard-nav";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Home",
  "/dashboard/send": "Send SMS",
  "/dashboard/sender-ids": "Sender ID",
  "/dashboard/contacts": "Contacts",
  "/dashboard/campaigns": "Campaigns",
  "/dashboard/templates": "Templates",
  "/dashboard/wallet": "Wallet",
  "/dashboard/reports": "Results",
  "/dashboard/pricing": "Pricing",
  "/dashboard/transactions": "Transactions",
  "/dashboard/invoices": "Invoices",
  "/dashboard/automation": "Automation",
  "/dashboard/api-keys": "Connections",
  "/dashboard/api-logs": "API Logs",
  "/dashboard/campaigns/new": "New campaign",
  "/dashboard/settings": "Settings",
  "/dashboard/support": "Support",
  "/developers": "Developers",
  "/developers/docs": "API Docs",
  "/developers/api-keys": "API Keys",
  "/developers/postman": "Postman",
  "/developers/webhooks": "Webhooks",
  "/developers/logs": "Logs",
  "/developers/integrations": "Integrations",
};

function getPageTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const cat of dashboardNavCategories) {
    for (const item of cat.items) {
      if (pathname.startsWith(item.href) && item.href !== "/dashboard") {
        return item.label;
      }
    }
  }
  if (pathname.startsWith("/developers")) return "Developers";
  if (pathname.startsWith("/dashboard/campaigns")) return "Campaigns";
  return "SplitSMS";
}

type MobileAppHeaderProps = {
  onMenuOpen: () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  balance: BalanceSnapshot;
};

export function MobileAppHeader({
  onMenuOpen,
  notifications,
  unreadCount,
  balance,
}: MobileAppHeaderProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const isHome = pathname === "/dashboard";

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-border/60 bg-background/95 backdrop-blur-lg safe-top md:hidden">
      <div className="flex h-12 items-center gap-2 px-3 max-w-lg mx-auto w-full">
        <button
          type="button"
          onClick={onMenuOpen}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-muted/80 active:bg-muted"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {isHome ? (
          <div className="min-w-0 flex-1 flex justify-center">
            <Logo href="/dashboard" size="sm" />
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate leading-tight">{title}</p>
          </div>
        )}

        <div className="shrink-0 min-w-0">
          <DashboardBalance snapshot={balance} variant="compact" />
        </div>

        <ThemeToggle className="h-8 w-8 shrink-0 rounded-lg" />
        <NotificationBell notifications={notifications} unreadCount={unreadCount} />
      </div>
    </header>
  );
}
