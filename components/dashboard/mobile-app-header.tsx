"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { NotificationBell, type NotificationItem } from "@/components/dashboard/notification-panel";
import type { BalanceSnapshot } from "@/lib/dashboard/balance-snapshot";
import { dashboardNavCategories } from "@/lib/navigation/dashboard-nav";
import { cn } from "@/lib/utils";

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
  const { walletBalance, walletCurrency, creditBalance, lowBalance } = balance;

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-border/60 bg-background/95 backdrop-blur-lg safe-top md:hidden">
      <div className="flex h-12 items-center gap-2 px-3 max-w-lg mx-auto w-full">
        <button
          type="button"
          onClick={onMenuOpen}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-foreground hover:bg-muted/80 active:bg-muted touch-target"
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

        {!isHome && (
          <Link
            href="/dashboard/wallet"
            className={cn(
              "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold tabular-nums transition-colors",
              lowBalance
                ? "border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-200"
                : "border-border/60 bg-muted/50 text-foreground",
            )}
          >
            {creditBalance.toLocaleString()} SMS
          </Link>
        )}

        <NotificationBell notifications={notifications} unreadCount={unreadCount} />
      </div>

      {isHome && (
        <div className="px-3 pb-2.5 border-t border-border/40 bg-muted/20 max-w-lg mx-auto w-full">
          <div className="flex items-center justify-between gap-2 text-xs">
            <Link
              href="/dashboard/wallet"
              className="font-semibold tabular-nums text-foreground"
            >
              {walletCurrency} {walletBalance.toFixed(2)}
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link
              href="/dashboard/wallet"
              className={cn(
                "font-bold tabular-nums",
                lowBalance ? "text-amber-600" : "text-primary",
              )}
            >
              {creditBalance.toLocaleString()} credits
            </Link>
            <Link href="/dashboard/wallet" className="text-primary font-semibold ml-auto">
              Top up →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
