"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import {
  adminNavSections,
  isAdminNavActive,
  type AdminNavItem,
} from "@/lib/navigation/admin-nav";
import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";

type AdminSidebarProps = {
  badges?: Partial<Record<NonNullable<AdminNavItem["badge"]>, number>>;
  onNavigate?: () => void;
  className?: string;
};

export function AdminSidebar({ badges, onNavigate, className }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex w-[220px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:h-[100dvh]",
        className,
      )}
    >
      <div className="flex h-12 items-center justify-between gap-2 border-b border-sidebar-border/80 px-3">
        <Logo href="/admin" size="sm" variant="white" />
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-sidebar-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-sidebar-primary">
          <Shield className="h-2.5 w-2.5" />
          Admin
        </span>
      </div>

      <nav className="sidebar-scroll flex-1 overflow-y-auto overscroll-contain px-2 py-3 space-y-4 min-h-0">
        {adminNavSections.map((section) => (
          <div key={section.id}>
            <p className="px-2 mb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/45">
              {section.label}
            </p>
            <ul className="space-y-px">
              {section.items.map((item) => {
                const active = isAdminNavActive(pathname, item.href);
                const badgeCount = item.badge ? badges?.[item.badge] : undefined;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] font-medium leading-tight transition-colors",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          active ? "opacity-100" : "opacity-70 group-hover:opacity-100",
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {badgeCount != null && badgeCount > 0 && (
                        <span
                          className={cn(
                            "min-w-[1.125rem] shrink-0 rounded-full px-1 py-px text-[9px] font-bold text-center tabular-nums leading-none",
                            active
                              ? "bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground"
                              : "bg-amber-500/20 text-amber-700 dark:text-amber-200",
                          )}
                        >
                          {badgeCount > 99 ? "99+" : badgeCount}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer space-y-0.5 p-2 safe-bottom">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="block rounded-md px-2 py-1.5 text-[11px] font-medium text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          ← Member dashboard
        </Link>
        <Link
          href="/pricing"
          target="_blank"
          onClick={onNavigate}
          className="block rounded-md px-2 py-1.5 text-[11px] font-medium text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          Public pricing ↗
        </Link>
      </div>
    </aside>
  );
}
