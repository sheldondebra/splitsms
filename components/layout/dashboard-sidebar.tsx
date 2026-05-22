"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import {
  dashboardNavCategories,
  isNavActive,
} from "@/lib/navigation/dashboard-nav";
import { cn } from "@/lib/utils";

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[260px] shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col">
      <div className="flex h-[4.25rem] items-center border-b border-sidebar-border/80 px-5">
        <Logo href="/dashboard" size="md" variant="white" />
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {dashboardNavCategories.map((category) => (
          <div key={category.id}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/35">
              {category.label}
            </p>
            <ul className="space-y-0.5">
              {category.items.map(({ href, label, icon: Icon }) => {
                const active = isNavActive(pathname, href);
                const isSenderId = href === "/dashboard/sender-ids";
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                        isSenderId &&
                          !active &&
                          "ring-1 ring-sidebar-primary/25 bg-sidebar-primary/5",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-[18px] w-[18px] shrink-0",
                          isSenderId && !active && "text-sidebar-primary",
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
      <div className="border-t border-sidebar-border/80 px-5 py-4 text-[11px] text-sidebar-foreground/40">
        SplitSMS
      </div>
    </aside>
  );
}
