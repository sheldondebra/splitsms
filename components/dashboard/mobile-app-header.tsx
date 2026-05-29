"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";
import { NotificationBell, type NotificationItem } from "@/components/dashboard/notification-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { DashboardBalance } from "@/components/dashboard/dashboard-balance";
import { PortalSwitch } from "@/components/dashboard/portal-switch";
import {
  UserProfileMenu,
  type MemberProfileSummary,
} from "@/components/dashboard/user-profile-menu";
import { getMemberPageTitle } from "@/lib/navigation/member-page-title";
import {
  developersNavItems,
  isDevelopersNavActive,
} from "@/lib/navigation/developers-nav";
import { cn } from "@/lib/utils";
import type { BalanceSnapshot } from "@/lib/dashboard/balance-snapshot";

type MobileAppHeaderProps = {
  onMenuOpen: () => void;
  profile: MemberProfileSummary;
  notifications: NotificationItem[];
  unreadCount: number;
  balance: BalanceSnapshot;
};

export function MobileAppHeader({
  onMenuOpen,
  profile,
  notifications,
  unreadCount,
  balance,
}: MobileAppHeaderProps) {
  const pathname = usePathname();
  const pageTitle = getMemberPageTitle(pathname);
  const isDevelopers = pathname.startsWith("/developers");

  return (
    <header className="dashboard-mobile-header sticky top-0 z-30 shrink-0 border-b border-border/70 bg-background/95 backdrop-blur-lg safe-top md:hidden">
      <div className="flex h-12 items-center gap-2 px-4">
        <button
          type="button"
          onClick={onMenuOpen}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-muted/80 active:bg-muted"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight truncate">{pageTitle}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <div className="max-w-[10rem] min-w-0 hidden min-[400px]:block">
            <DashboardBalance snapshot={balance} variant="compact" />
          </div>
          <ThemeToggle className="h-8 w-8 shrink-0 rounded-lg" />
          <NotificationBell notifications={notifications} unreadCount={unreadCount} />
          <UserProfileMenu profile={profile} />
        </div>
      </div>

      {isDevelopers && (
        <div className="border-t border-border/50 px-4 py-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <PortalSwitch />
            <div className="min-w-0 min-[400px]:hidden">
              <DashboardBalance snapshot={balance} variant="compact" />
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-0.5 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {developersNavItems.map(({ href, label, exact }) => {
              const active = isDevelopersNavActive(pathname, href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "snap-start shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/70 text-muted-foreground",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
