"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  dashboardNavCategories,
  isNavActive,
} from "@/lib/navigation/dashboard-nav";
import { ThemeSidebarToggle } from "@/components/dashboard/theme-sidebar-toggle";
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
    <>
      <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-5 min-h-0">
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
                        "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors touch-target-lg",
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
                          "h-5 w-5 shrink-0",
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
        <div className="shrink-0 border-t border-sidebar-border/80 p-4 space-y-3 safe-bottom">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 px-1">
            Appearance
          </p>
          <ThemeSidebarToggle />
          <LogoutConfirmButton
            variant="ghost"
            fullWidth
            className="text-sidebar-foreground/80 hover:text-destructive hover:bg-destructive/10 h-11"
            label="Sign out"
          />
        </div>
      )}
    </>
  );
}
