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
        "flex w-[232px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:h-[100dvh]",
        className,
      )}
    >
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4">
        <Logo href="/admin" size="sm" />
        <span className="rounded-md bg-sidebar-primary/12 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sidebar-primary">
          Admin
        </span>
      </div>

      <nav className="sidebar-scroll flex-1 overflow-y-auto overscroll-contain px-3 py-4 min-h-0">
        <div className="space-y-5">
          {adminNavSections.map((section) => (
            <div key={section.id}>
              <p className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/40">
                {section.label}
              </p>
              <ul className="space-y-0.5">
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
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium leading-none transition-colors",
                          active
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                            : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0 opacity-90" />
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {badgeCount != null && badgeCount > 0 && (
                          <span
                            className={cn(
                              "min-w-[1.15rem] shrink-0 rounded-full px-1 py-0.5 text-center text-[10px] font-bold tabular-nums leading-none",
                              active
                                ? "bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground"
                                : "bg-amber-500/15 text-amber-800 dark:text-amber-200",
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
        </div>
      </nav>

      <div className="shrink-0 space-y-0.5 border-t border-sidebar-border p-3 safe-bottom">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="block rounded-lg px-2.5 py-2 text-[12px] font-medium text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          ← Member dashboard
        </Link>
        <Link
          href="/pricing"
          target="_blank"
          onClick={onNavigate}
          className="block rounded-lg px-2.5 py-2 text-[12px] font-medium text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          Public pricing ↗
        </Link>
      </div>
    </aside>
  );
}
