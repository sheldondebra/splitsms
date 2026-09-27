"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DevelopersSidebar } from "@/components/developers/developers-sidebar";
import type { TenantBranding } from "@/lib/reseller/tenant";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { MobileNavDrawer } from "@/components/dashboard/mobile-nav-drawer";
import { MobileAppHeader } from "@/components/dashboard/mobile-app-header";
import { MemberSidebarCollapseProvider } from "@/components/layout/member-sidebar-collapse";
import type { NotificationItem } from "@/components/dashboard/notification-panel";
import type { BalanceSnapshot } from "@/lib/dashboard/balance-snapshot";
import type { MemberProfileSummary } from "@/components/dashboard/user-profile-menu";
import { PlatformFeaturesProvider } from "@/components/platform/platform-features-context";
import type { PlatformFeatureFlags } from "@/lib/platform/feature-catalog";
import { OfflineProvider } from "@/components/offline/offline-provider";
import { OfflineBanner } from "@/components/offline/offline-banner";

type MemberAppShellProps = {
  children: React.ReactNode;
  greeting: string;
  profile: MemberProfileSummary;
  notifications: NotificationItem[];
  unreadCount: number;
  balance: BalanceSnapshot;
  tenant?: TenantBranding | null;
  showResellerPortal?: boolean;
  featureFlags: PlatformFeatureFlags;
};

export function MemberAppShell({
  children,
  greeting,
  profile,
  notifications,
  unreadCount,
  balance,
  tenant,
  showResellerPortal = false,
  featureFlags,
}: MemberAppShellProps) {
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const pathname = usePathname();
  const isDevelopers = pathname.startsWith("/developers");
  const menuOpen = menuPath === pathname;

  return (
    <PlatformFeaturesProvider flags={featureFlags}>
      <OfflineProvider>
        <MemberSidebarCollapseProvider>
          <div className="flex min-h-[100dvh] bg-background max-md:h-[100dvh] max-md:overflow-hidden">
            {!isDevelopers && <DashboardSidebar />}
            {isDevelopers && <DevelopersSidebar />}

            <div className="flex min-h-0 flex-1 flex-col min-w-0 w-full max-w-[100vw]">
              <MobileAppHeader
                profile={profile}
                notifications={notifications}
                unreadCount={unreadCount}
              />

              <div className="hidden md:block">
                <DashboardTopbar
                  greeting={greeting}
                  profile={profile}
                  notifications={notifications}
                  unreadCount={unreadCount}
                  balance={balance}
                  showResellerPortal={showResellerPortal}
                />
              </div>

              <OfflineBanner />

              <main className="member-main flex-1 overflow-y-auto overflow-x-hidden">
                <div className="member-content">{children}</div>
              </main>

              <MobileNav
                menuOpen={menuOpen}
                onMenuOpen={() =>
                  setMenuPath((current) => (current === pathname ? null : pathname))
                }
                onTabNavigate={() => setMenuPath(null)}
              />
              <MobileNavDrawer
                open={menuOpen}
                onClose={() => setMenuPath(null)}
                tenant={tenant}
                profile={profile}
                showResellerPortal={showResellerPortal}
              />
            </div>
          </div>
        </MemberSidebarCollapseProvider>
      </OfflineProvider>
    </PlatformFeaturesProvider>
  );
}
