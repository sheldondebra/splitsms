"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminMobileHeader } from "@/components/layout/admin-mobile-header";
import { AdminNavDrawer } from "@/components/layout/admin-nav-drawer";
import { HeaderAccountMenu } from "@/components/layout/header-account-menu";
import { AdminSystemSyncButton } from "@/components/admin/admin-system-sync-button";
import { AdminTopbarSearch } from "@/components/admin/admin-topbar-search";
import { AdminTopbarQueuePill } from "@/components/admin/admin-topbar-queue-pill";
import { AdminTopbarClock } from "@/components/admin/admin-topbar-clock";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { HeaderAccountProfile } from "@/lib/user/header-account-types";
import type { AdminActor } from "@/lib/auth/admin-route-access";
import { getAdminPageTitle } from "@/lib/navigation/admin-nav";
import type { AdminNavBadgePreviews } from "@/lib/analytics/admin-dashboard";
import { Shield, Wrench } from "lucide-react";
import type { AdminNavItem } from "@/lib/navigation/admin-nav";

type AdminAppShellProps = {
  children: React.ReactNode;
  subtitle?: string;
  profile: HeaderAccountProfile;
  staffAccess?: AdminActor;
  banner?: React.ReactNode;
  badges?: Partial<Record<NonNullable<AdminNavItem["badge"]>, number>>;
  badgePreviews?: AdminNavBadgePreviews;
  maintenanceOn?: boolean;
};

export function AdminAppShell({
  children,
  subtitle,
  profile,
  staffAccess,
  banner,
  badges,
  badgePreviews,
  maintenanceOn,
}: AdminAppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const title = getAdminPageTitle(pathname);
  const pendingPayments = badges?.["pending-payments"] ?? 0;
  const pendingSender = badges?.["pending-sender-ids"] ?? 0;
  const openSupport = badges?.["open-support-tickets"] ?? 0;
  const attention = badges?.["operations-attention"] ?? pendingPayments + pendingSender + openSupport;
  const previews = badgePreviews ?? {
    operations: [],
    payments: [],
    senderIds: [],
    support: [],
  };

  return (
    <div className="flex min-h-[100dvh] bg-background">
      <AdminSidebar badges={badges} staffAccess={staffAccess} className="hidden md:flex" />

      <div className="flex flex-1 flex-col min-w-0 w-full max-w-[100vw]">
        {banner}
        <AdminMobileHeader
          onMenuOpen={() => setMenuOpen(true)}
          subtitle={subtitle}
          profile={profile}
          badges={badges}
        />

        <header className="admin-topbar hidden md:flex sticky top-0 z-30 h-14 shrink-0 items-center justify-between gap-4 border-b border-border/70 bg-background/95 px-6 lg:px-8 backdrop-blur-md">
          <div className="min-w-0 flex items-center gap-3 shrink-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Shield className="h-4 w-4" />
            </div>
            <div className="min-w-0 max-w-[10rem] xl:max-w-[14rem]">
              <p className="text-sm font-semibold leading-tight truncate">{title}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>
          </div>

          <AdminTopbarSearch className="mx-2 flex-1" />

          <div className="flex items-center gap-3 shrink-0">
            <AdminTopbarClock />
            {maintenanceOn && (
              <Link href="/admin/general?tab=maintenance">
                <Badge
                  variant="outline"
                  className="hidden items-center gap-1 border-amber-500/40 bg-amber-500/10 text-amber-800 sm:inline-flex dark:text-amber-200"
                >
                  <Wrench className="h-3 w-3" />
                  Maintenance on
                </Badge>
              </Link>
            )}
            {attention > 0 && (
              <div className="hidden xl:flex items-center gap-2">
                <AdminTopbarQueuePill
                  href="/admin/operations"
                  label={`Operations · ${attention}`}
                  items={previews.operations}
                  tone="primary"
                />
                {pendingPayments > 0 && (
                  <AdminTopbarQueuePill
                    href="/admin/payments"
                    label={`${pendingPayments} payment${pendingPayments !== 1 ? "s" : ""}`}
                    items={previews.payments}
                  />
                )}
                {pendingSender > 0 && (
                  <AdminTopbarQueuePill
                    href="/admin/sender-ids"
                    label={`${pendingSender} sender ID${pendingSender !== 1 ? "s" : ""}`}
                    items={previews.senderIds}
                  />
                )}
                {openSupport > 0 && (
                  <AdminTopbarQueuePill
                    href="/admin/support"
                    label={`${openSupport} support`}
                    items={previews.support}
                  />
                )}
              </div>
            )}
            {profile.role === "SUPER_ADMIN" && <AdminSystemSyncButton />}
            <ThemeToggle className="h-9 w-9 rounded-lg shrink-0" />
            <HeaderAccountMenu profile={profile} variant="pill" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden admin-main">
          <div className="admin-content">{children}</div>
        </main>
      </div>

      <AdminNavDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        badges={badges}
        staffAccess={staffAccess}
      />
    </div>
  );
}
