"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet } from "lucide-react";
import {
  dashboardNavCategories,
  isNavActive,
} from "@/lib/navigation/dashboard-nav";
import { LogoutConfirmButton } from "@/components/auth/logout-confirm-button";
import { cn } from "@/lib/utils";

type SidebarNavContentProps = {
  onNavigate?: () => void;
  showFooter?: boolean;
};

export function SidebarNavContent({
  onNavigate,
  showFooter = true,
}: SidebarNavContentProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <nav className="sidebar-scroll flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-5 min-h-0">
        {dashboardNavCategories.map((category) => (
          <div key={category.id}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/45">
              {category.label}
            </p>
            <ul className="space-y-0.5">
              {category.items.map(({ href, label, icon: Icon }) => {
                const active = isNavActive(pathname, href);
                const isSenderId = href === "/dashboard/sender-ids";
                const isDevelopers = href === "/developers";
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors touch-target-lg",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                        isSenderId &&
                          !active &&
                          "ring-1 ring-sidebar-primary/30 bg-sidebar-primary/8",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-[18px] w-[18px] shrink-0",
                          (isSenderId || isDevelopers) &&
                            !active &&
                            "text-sidebar-primary",
                        )}
                      />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {showFooter && (
        <div className="sidebar-footer p-4 space-y-3 safe-bottom">
          <Link
            href="/dashboard/wallet"
            onClick={onNavigate}
            className="group flex items-start gap-3 rounded-xl border border-sidebar-primary/20 bg-gradient-to-br from-sidebar-primary/12 to-sidebar-primary/5 px-3.5 py-3 transition-colors hover:border-sidebar-primary/35 hover:from-sidebar-primary/18"
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/15 text-sidebar-primary">
              <Wallet className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-sidebar-foreground">
                Add SMS credits
              </span>
              <span className="block text-xs text-sidebar-foreground/55 group-hover:text-sidebar-foreground/70">
                Top up wallet &amp; keep sending
              </span>
            </span>
          </Link>

          <LogoutConfirmButton
            variant="ghost"
            fullWidth
            className="h-11 justify-start gap-3 font-medium text-red-600 hover:text-red-600 hover:bg-red-500/10 dark:text-red-400 dark:hover:text-red-400 dark:hover:bg-red-500/15"
            label="Sign out"
          />
        </div>
      )}
    </div>
  );
}
