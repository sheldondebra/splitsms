"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { AdminNavBadgePreviewItem } from "@/lib/analytics/admin-dashboard";

export function AdminTopbarQueuePill({
  href,
  label,
  items,
  tone = "amber",
}: {
  href: string;
  label: string;
  items: AdminNavBadgePreviewItem[];
  tone?: "primary" | "amber";
}) {
  return (
    <div className="group relative">
      <Link
        href={href}
        className={cn(
          "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
          tone === "primary"
            ? "bg-primary/15 text-primary hover:bg-primary/25"
            : "bg-amber-500/15 text-amber-800 hover:bg-amber-500/25 dark:text-amber-200",
        )}
      >
        {label}
      </Link>

      <div
        className={cn(
          "invisible absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-border/70 bg-card p-2 shadow-lg",
          "opacity-0 transition-all duration-150",
          "group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100",
        )}
      >
        <p className="px-2 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          First {Math.min(5, items.length)}
          {items.length === 0 ? " — queue empty" : ""}
        </p>
        {items.length === 0 ? (
          <p className="px-2 py-2 text-xs text-muted-foreground">Nothing waiting right now.</p>
        ) : (
          <ul className="max-h-64 space-y-0.5 overflow-y-auto">
            {items.slice(0, 5).map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="block rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/70"
                >
                  <p className="truncate text-xs font-semibold text-foreground">{item.title}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{item.subtitle}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={href}
          className="mt-1 block rounded-lg px-2 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/10"
        >
          Open all →
        </Link>
      </div>
    </div>
  );
}
