"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { mobileNavItems, isNavActive } from "@/lib/navigation/dashboard-nav";
import { cn } from "@/lib/utils";

type MobileNavProps = {
  onMenuOpen: () => void;
};

export function MobileNav({ onMenuOpen }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/80 bg-background/95 backdrop-blur-xl md:hidden safe-bottom shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.35)]">
      <div className="flex items-stretch justify-around px-1 pt-1 pb-1 max-w-lg mx-auto">
        {mobileNavItems.map(({ href, label, icon: Icon }) => {
          const active = isNavActive(pathname, href);
          const short =
            label === "Message results"
              ? "Results"
              : label === "Sender ID"
                ? "Sender"
                : label;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 transition-colors touch-target",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl transition-all",
                  active && "bg-primary text-primary-foreground shadow-md shadow-primary/25",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              </span>
              <span className="truncate text-[10px] font-semibold leading-none max-w-[4.5rem]">
                {short}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onMenuOpen}
          className={cn(
            "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 transition-colors touch-target text-muted-foreground",
          )}
          aria-label="Open menu"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl">
            <Menu className="h-5 w-5" />
          </span>
          <span className="text-[10px] font-semibold leading-none">Menu</span>
        </button>
      </div>
    </nav>
  );
}
