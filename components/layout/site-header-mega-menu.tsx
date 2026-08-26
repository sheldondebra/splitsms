"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { MegaMenu } from "@/lib/navigation/marketing-nav";
import { cn } from "@/lib/utils";

export function SiteHeaderMegaPanel({
  menu,
  onNavigate,
}: {
  menu: MegaMenu;
  onNavigate?: () => void;
}) {
  return (
    <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_16rem] lg:gap-10">
      <div
        className={cn(
          "grid gap-8",
          menu.columns.length > 1 ? "sm:grid-cols-2" : "sm:grid-cols-1 max-w-md",
        )}
      >
        {menu.columns.map((column) => (
          <div key={column.title}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {column.title}
            </p>
            <ul className="mt-3 space-y-0.5">
              {column.links.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onNavigate}
                      className="group flex gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/80"
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-foreground group-hover:text-primary">
                          {link.label}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                          {link.description}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <aside className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/12 via-card to-card p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          {menu.featured.eyebrow}
        </p>
        <p className="mt-2 text-base font-semibold tracking-tight">{menu.featured.title}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{menu.featured.body}</p>
        <Link
          href={menu.featured.href}
          onClick={onNavigate}
          className={cn(
            buttonVariants({ size: "sm" }),
            "mt-5 gap-1.5 font-semibold",
          )}
        >
          {menu.featured.cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </aside>
    </div>
  );
}
