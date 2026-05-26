"use client";

import { usePathname } from "next/navigation";
import { NotificationBell, type NotificationItem } from "@/components/dashboard/notification-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { DashboardBalance } from "@/components/dashboard/dashboard-balance";
import { PortalSwitch } from "@/components/dashboard/portal-switch";
import { getMemberPageTitle } from "@/lib/navigation/member-page-title";
import type { BalanceSnapshot } from "@/lib/dashboard/balance-snapshot";

type DashboardTopbarProps = {
  greeting: string;
  notifications: NotificationItem[];
  unreadCount: number;
  balance: BalanceSnapshot;
};

export function DashboardTopbar({
  greeting,
  notifications,
  unreadCount,
  balance,
}: DashboardTopbarProps) {
  const pathname = usePathname();
  const pageTitle = getMemberPageTitle(pathname);
  const isHome = pathname === "/dashboard";

  return (
    <header className="dashboard-topbar sticky top-0 z-30 shrink-0 border-b border-border/70 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/90">
      <div className="flex h-14 items-center gap-4 px-4 md:px-6 lg:px-8 xl:px-10">
        <div className="min-w-0 shrink">
          <h1 className="text-sm font-semibold leading-tight truncate text-foreground md:text-base">
            {pageTitle}
          </h1>
          <p className="text-xs text-muted-foreground truncate hidden sm:block">
            {isHome ? `Welcome back, ${greeting}` : `Hi, ${greeting}`}
          </p>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3 min-w-0">
          <div className="hidden md:flex min-w-0 max-w-md lg:max-w-lg">
            <DashboardBalance snapshot={balance} variant="compact" />
          </div>

          <PortalSwitch className="shrink-0 md:hidden lg:inline-flex" />

          <div className="flex items-center gap-0.5 shrink-0 rounded-lg border border-border/60 bg-muted/30 p-0.5">
            <ThemeToggle className="h-8 w-8 rounded-md hover:bg-background/80" />
            <NotificationBell notifications={notifications} unreadCount={unreadCount} />
          </div>
        </div>
      </div>
    </header>
  );
}
