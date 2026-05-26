"use client";

import Link from "next/link";
import { Menu, Shield } from "lucide-react";
import { getAdminPageTitle } from "@/lib/navigation/admin-nav";
import { usePathname } from "next/navigation";
import { LogoutConfirmButton } from "@/components/auth/logout-confirm-button";
import { cn } from "@/lib/utils";
import type { AdminNavItem } from "@/lib/navigation/admin-nav";

type AdminMobileHeaderProps = {
  onMenuOpen: () => void;
  subtitle?: string;
  badges?: Partial<Record<NonNullable<AdminNavItem["badge"]>, number>>;
};

export function AdminMobileHeader({ onMenuOpen, subtitle, badges }: AdminMobileHeaderProps) {
  const pathname = usePathname();
  const title = getAdminPageTitle(pathname);
  const pendingPayments = badges?.["pending-payments"] ?? 0;
  const pendingSender = badges?.["pending-sender-ids"] ?? 0;
  const attention = pendingPayments + pendingSender;

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-border/70 bg-background/95 backdrop-blur-lg safe-top md:hidden">
      <div className="flex h-12 items-center gap-2 px-4">
        <button
          type="button"
          onClick={onMenuOpen}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-muted/80"
          aria-label="Open admin menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate leading-tight">{title}</p>
            {subtitle && (
              <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {attention > 0 && (
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-200 tabular-nums">
            {attention}
          </span>
        )}
        <LogoutConfirmButton variant="ghost" size="sm" label="Out" showIcon={false} />
      </div>
      {(pendingPayments > 0 || pendingSender > 0) && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {pendingPayments > 0 && (
            <Link
              href="/admin/payments"
              className="shrink-0 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-200"
            >
              {pendingPayments} payments
            </Link>
          )}
          {pendingSender > 0 && (
            <Link
              href="/admin/sender-ids"
              className="shrink-0 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-200"
            >
              {pendingSender} sender IDs
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
