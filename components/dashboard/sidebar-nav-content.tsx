"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Wallet } from "lucide-react";
import {
  dashboardNavSections,
  isNavActive,
} from "@/lib/navigation/dashboard-nav";
import { LogoutConfirmButton } from "@/components/auth/logout-confirm-button";
import { useNavIconTip } from "@/components/layout/nav-icon-tip";
import { cn } from "@/lib/utils";

type SidebarNavContentProps = {
  onNavigate?: () => void;
  showFooter?: boolean;
  collapsed?: boolean;
};

export function SidebarNavContent({
  onNavigate,
  showFooter = true,
  collapsed = false,
}: SidebarNavContentProps) {
  const pathname = usePathname();
  const tip = useNavIconTip(collapsed);

  const initialOpen = useMemo(() => {
    const entries = dashboardNavSections
      .filter((s) => s.collapsible)
      .map((s) => {
        const active = s.items.some((item) => isNavActive(pathname, item.href));
        return [s.id, active || Boolean(s.defaultOpen)] as const;
      });
    return Object.fromEntries(entries) as Record<string, boolean>;
  }, [pathname]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(initialOpen);

  useEffect(() => {
    for (const section of dashboardNavSections) {
      if (!section.collapsible) continue;
      if (section.items.some((item) => isNavActive(pathname, item.href))) {
        setOpenSections((prev) => (prev[section.id] ? prev : { ...prev, [section.id]: true }));
      }
    }
  }, [pathname]);

  const navItemClass = (active: boolean, highlight?: boolean) =>
    cn(
      "flex items-center rounded-lg text-[13px] font-medium leading-none transition-colors",
      collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-2.5 py-2",
      active
        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
        : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
      highlight && !active && "ring-1 ring-sidebar-primary/30 bg-sidebar-primary/8",
    );

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {tip.node}
      <nav
        className={cn(
          "sidebar-scroll flex-1 overflow-y-auto overscroll-contain py-3 space-y-3 min-h-0",
          collapsed ? "px-2" : "px-3 py-4 space-y-4",
        )}
      >
        {dashboardNavSections.map((section) => {
          const isCollapsible = Boolean(section.collapsible);
          const isOpen = collapsed || !isCollapsible || openSections[section.id];

          return (
            <div key={section.id}>
              {collapsed ? (
                section.id !== "main" ? (
                  <div className="mx-auto mb-2 h-px w-6 bg-sidebar-border/80" aria-hidden />
                ) : null
              ) : (
                <div className="flex items-center justify-between px-1">
                  <p
                    className={cn(
                      "px-2 font-semibold uppercase tracking-widest",
                      isCollapsible
                        ? "text-[11px] text-sidebar-primary font-bold tracking-[0.14em]"
                        : "text-[10px] text-sidebar-foreground/45",
                    )}
                  >
                    {section.label}
                  </p>
                  {isCollapsible ? (
                    <button
                      type="button"
                      onClick={() =>
                        setOpenSections((prev) => ({ ...prev, [section.id]: !prev[section.id] }))
                      }
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                        "text-sidebar-primary/80 hover:bg-sidebar-primary/10 hover:text-sidebar-primary",
                        isOpen && "text-sidebar-primary",
                      )}
                      aria-label={`Toggle ${section.label}`}
                    >
                      <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                    </button>
                  ) : null}
                </div>
              )}

              {isOpen ? (
                <ul className={cn(collapsed ? "space-y-0.5" : "mt-2 space-y-0.5")}>
                  {section.items.map(({ href, label, icon: Icon }) => {
                    const active = isNavActive(pathname, href);
                    const highlight = href === "/developers";
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          onClick={onNavigate}
                          aria-label={label}
                          className={navItemClass(active, highlight)}
                          onMouseEnter={(e) => tip.show(e, label)}
                          onMouseLeave={tip.hide}
                          onFocus={(e) => tip.show(e, label)}
                          onBlur={tip.hide}
                        >
                          <Icon
                            className={cn(
                              "shrink-0",
                              collapsed ? "h-[18px] w-[18px]" : "h-4 w-4",
                              highlight && !active && "text-sidebar-primary",
                            )}
                          />
                          {collapsed ? <span className="sr-only">{label}</span> : <span className="truncate">{label}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </nav>

      {showFooter && (
        <div className={cn("sidebar-footer safe-bottom", collapsed ? "p-2 space-y-2" : "p-4 space-y-3")}>
          <Link
            href="/dashboard/wallet"
            onClick={onNavigate}
            aria-label="Add SMS credits"
            className={cn(
              "group flex rounded-lg border border-sidebar-primary/20 bg-gradient-to-br from-sidebar-primary/12 to-sidebar-primary/5 transition-colors hover:border-sidebar-primary/35 hover:from-sidebar-primary/18",
              collapsed ? "items-center justify-center p-2" : "items-start gap-2.5 px-3 py-2.5",
            )}
            onMouseEnter={(e) => tip.show(e, "Add SMS credits")}
            onMouseLeave={tip.hide}
            onFocus={(e) => tip.show(e, "Add SMS credits")}
            onBlur={tip.hide}
          >
            <span
              className={cn(
                "flex shrink-0 items-center justify-center rounded-md bg-sidebar-primary/15 text-sidebar-primary",
                collapsed ? "h-8 w-8" : "mt-0.5 h-7 w-7",
              )}
            >
              <Wallet className="h-3.5 w-3.5" aria-hidden />
            </span>
            {collapsed ? (
              <span className="sr-only">Add SMS credits</span>
            ) : (
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold leading-4 text-sidebar-foreground">
                  Add SMS credits
                </span>
                <span className="block text-[11px] leading-4 text-sidebar-foreground/55 group-hover:text-sidebar-foreground/70">
                  Top up wallet and keep sending
                </span>
              </span>
            )}
          </Link>

          <span
            className={collapsed ? "flex justify-center" : undefined}
            onMouseEnter={(e) => collapsed && tip.show(e, "Sign out")}
            onMouseLeave={tip.hide}
          >
            <LogoutConfirmButton
              variant="ghost"
              fullWidth={!collapsed}
              iconOnly={collapsed}
              size={collapsed ? "icon" : "default"}
              className={cn(
                collapsed
                  ? "h-10 w-10 text-red-600 hover:text-red-600 hover:bg-red-500/10 dark:text-red-400 dark:hover:text-red-400 dark:hover:bg-red-500/15"
                  : "h-11 justify-start gap-3 font-medium text-red-600 hover:text-red-600 hover:bg-red-500/10 dark:text-red-400 dark:hover:text-red-400 dark:hover:bg-red-500/15",
              )}
              label="Sign out"
            />
          </span>
        </div>
      )}
    </div>
  );
}
