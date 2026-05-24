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
        "flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:h-[100dvh]",
        className,
      )}
    >
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <Logo href="/admin" size="md" variant="white" />
      </div>

      <nav className="sidebar-scroll flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-6 min-h-0">
        {adminNavSections.map((section) => (
          <div key={section.id}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
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
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {badgeCount != null && badgeCount > 0 && (
                        <span
                          className={cn(
                            "min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-[10px] font-bold text-center tabular-nums",
                            active
                              ? "bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground"
                              : "bg-amber-500/20 text-amber-200",
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

      <div className="sidebar-footer p-4 space-y-2 safe-bottom">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="block text-xs text-sidebar-foreground/55 hover:text-primary transition-colors"
        >
          ← Member dashboard
        </Link>
        <Link
          href="/pricing"
          target="_blank"
          onClick={onNavigate}
          className="block text-xs text-sidebar-foreground/55 hover:text-primary transition-colors"
        >
          View public pricing ↗
        </Link>
      </div>
    </aside>
  );
}
