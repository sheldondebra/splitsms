"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminMobileHeader } from "@/components/layout/admin-mobile-header";
import { AdminNavDrawer } from "@/components/layout/admin-nav-drawer";
import { LogoutConfirmButton } from "@/components/auth/logout-confirm-button";
import { getAdminPageTitle } from "@/lib/navigation/admin-nav";
import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";
import type { AdminNavItem } from "@/lib/navigation/admin-nav";

type AdminAppShellProps = {
  children: React.ReactNode;
  subtitle?: string;
  badges?: Partial<Record<NonNullable<AdminNavItem["badge"]>, number>>;
};

export function AdminAppShell({ children, subtitle, badges }: AdminAppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const title = getAdminPageTitle(pathname);
  const pendingPayments = badges?.["pending-payments"] ?? 0;
  const pendingSender = badges?.["pending-sender-ids"] ?? 0;

  return (
    <div className="flex min-h-[100dvh] bg-background">
      <AdminSidebar badges={badges} className="hidden md:flex" />

      <div className="flex flex-1 flex-col min-w-0 w-full max-w-[100vw]">
        <AdminMobileHeader
          onMenuOpen={() => setMenuOpen(true)}
          subtitle={subtitle}
          badges={badges}
        />

        <header className="admin-topbar hidden md:flex sticky top-0 z-30 h-14 shrink-0 items-center justify-between gap-4 border-b border-border/70 bg-background/95 px-6 lg:px-8 backdrop-blur-md">
          <div className="min-w-0 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Shield className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight truncate">{title}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {(pendingPayments > 0 || pendingSender > 0) && (
              <div className="hidden lg:flex items-center gap-2">
                {pendingPayments > 0 && (
                  <Link
                    href="/admin/payments"
                    className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-200 hover:bg-amber-500/25 transition-colors"
                  >
                    {pendingPayments} payment{pendingPayments !== 1 ? "s" : ""}
                  </Link>
                )}
                {pendingSender > 0 && (
                  <Link
                    href="/admin/sender-ids"
                    className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-200 hover:bg-amber-500/25 transition-colors"
                  >
                    {pendingSender} sender ID{pendingSender !== 1 ? "s" : ""}
                  </Link>
                )}
              </div>
            )}
            <LogoutConfirmButton
              variant="outline"
              size="sm"
              label="Sign out"
              showIcon={false}
              className="rounded-lg h-9"
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden admin-main">
          <div className="admin-content">{children}</div>
        </main>
      </div>

      <AdminNavDrawer open={menuOpen} onClose={() => setMenuOpen(false)} badges={badges} />
    </div>
  );
}
