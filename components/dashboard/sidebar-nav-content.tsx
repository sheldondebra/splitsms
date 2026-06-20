"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronDown, Wallet } from "lucide-react";
import {
  dashboardNavSections,
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

  const initialOpen = useMemo(() => {
    const entries = dashboardNavSections
      .filter((s) => s.collapsible)
      .map((s) => [s.id, Boolean(s.defaultOpen)] as const);
    return Object.fromEntries(entries) as Record<string, boolean>;
  }, []);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(initialOpen);

  const navItemClass = (active: boolean, highlight?: boolean) =>
    cn(
      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium leading-none transition-colors",
      active
        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
        : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
      highlight && !active && "ring-1 ring-sidebar-primary/30 bg-sidebar-primary/8",
    );

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <nav className="sidebar-scroll flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-4 min-h-0">
        {dashboardNavSections.map((section) => {
          const isCollapsible = Boolean(section.collapsible);
          const isOpen = isCollapsible ? openSections[section.id] : true;

          return (
            <div key={section.id}>
              <div className="flex items-center justify-between px-1">
                <p className="px-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/45">
                  {section.label}
                </p>
                {isCollapsible ? (
                  <button
                    type="button"
                    onClick={() =>
                      setOpenSections((prev) => ({ ...prev, [section.id]: !prev[section.id] }))
                    }
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors",
                      isOpen && "text-sidebar-foreground",
                    )}
                    aria-label={`Toggle ${section.label}`}
                  >
                    <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                  </button>
                ) : null}
              </div>

              {isOpen ? (
                <ul className="mt-2 space-y-0.5">
                  {section.items.map(({ href, label, icon: Icon }) => {
                    const active = isNavActive(pathname, href);
                    const highlight = href === "/dashboard/sender-ids" || href === "/developers";
                    return (
                      <li key={href}>
                        <Link href={href} onClick={onNavigate} className={navItemClass(active, highlight)}>
                          <Icon
                            className={cn(
                              "h-4 w-4 shrink-0",
                              highlight && !active && "text-sidebar-primary",
                            )}
                          />
                          <span className="truncate">{label}</span>
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
        <div className="sidebar-footer p-4 space-y-3 safe-bottom">
          <Link
            href="/dashboard/wallet"
            onClick={onNavigate}
            className="group flex items-start gap-2.5 rounded-lg border border-sidebar-primary/20 bg-gradient-to-br from-sidebar-primary/12 to-sidebar-primary/5 px-3 py-2.5 transition-colors hover:border-sidebar-primary/35 hover:from-sidebar-primary/18"
          >
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sidebar-primary/15 text-sidebar-primary">
              <Wallet className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold leading-4 text-sidebar-foreground">
                Add SMS credits
              </span>
              <span className="block text-[11px] leading-4 text-sidebar-foreground/55 group-hover:text-sidebar-foreground/70">
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
