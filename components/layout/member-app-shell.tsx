"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { TenantDashboardSidebar } from "@/components/tenant/tenant-sidebar";
import { DevelopersSidebar } from "@/components/developers/developers-sidebar";
import type { TenantBranding } from "@/lib/reseller/tenant";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { MobileNavDrawer } from "@/components/dashboard/mobile-nav-drawer";
import { MobileAppHeader } from "@/components/dashboard/mobile-app-header";
import type { NotificationItem } from "@/components/dashboard/notification-panel";
import type { BalanceSnapshot } from "@/lib/dashboard/balance-snapshot";

type MemberAppShellProps = {
  children: React.ReactNode;
  greeting: string;
  notifications: NotificationItem[];
  unreadCount: number;
  balance: BalanceSnapshot;
  tenant?: TenantBranding | null;
};

export function MemberAppShell({
  children,
  greeting,
  notifications,
  unreadCount,
  balance,
  tenant,
}: MemberAppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isDevelopers = pathname.startsWith("/developers");

  return (
    <div className="flex min-h-[100dvh] bg-background">
      {!isDevelopers && <DashboardSidebar />}
      {isDevelopers && (
        <div className="hidden md:flex shrink-0">
          <DevelopersSidebar />
        </div>
      )}

      <div className="flex flex-1 flex-col min-w-0 w-full max-w-[100vw]">
        <MobileAppHeader
          onMenuOpen={() => setMenuOpen(true)}
          notifications={notifications}
          unreadCount={unreadCount}
          balance={balance}
        />

        <div className="hidden md:block">
          <DashboardTopbar
            greeting={greeting}
            notifications={notifications}
            unreadCount={unreadCount}
            balance={balance}
          />
        </div>

        <main className="member-main flex-1 overflow-y-auto overflow-x-hidden">
          <div className="member-content">{children}</div>
        </main>

        <MobileNav onMenuOpen={() => setMenuOpen(true)} />
        <MobileNavDrawer open={menuOpen} onClose={() => setMenuOpen(false)} tenant={tenant} />
      </div>
    </div>
  );
}
