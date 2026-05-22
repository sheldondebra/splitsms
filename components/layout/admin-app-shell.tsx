"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminMobileHeader } from "@/components/layout/admin-mobile-header";
import { AdminNavDrawer } from "@/components/layout/admin-nav-drawer";
import { LogoutConfirmButton } from "@/components/auth/logout-confirm-button";
import { getAdminPageTitle } from "@/lib/navigation/admin-nav";
import { usePathname } from "next/navigation";
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

  return (
    <div className="flex min-h-[100dvh] bg-background">
      <AdminSidebar badges={badges} className="hidden md:flex" />

      <div className="flex flex-1 flex-col min-w-0 w-full">
        <AdminMobileHeader onMenuOpen={() => setMenuOpen(true)} subtitle={subtitle} />

        <header className="hidden md:flex sticky top-0 z-10 h-16 items-center justify-between border-b border-border/80 bg-background/90 px-6 lg:px-8 backdrop-blur-md">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Admin console
            </p>
            <p className="text-lg font-semibold tracking-tight leading-tight">{title}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          <LogoutConfirmButton variant="outline" size="sm" label="Sign out" showIcon={false} />
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden admin-main">
          <div className="admin-content">{children}</div>
        </main>
      </div>

      <AdminNavDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        badges={badges}
      />
    </div>
  );
}
