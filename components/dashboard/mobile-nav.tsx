"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { mobileNavItems, isNavActive } from "@/lib/navigation/dashboard-nav";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/80 bg-background/95 backdrop-blur-lg md:hidden safe-bottom">
      <div className="flex items-stretch justify-around gap-0.5 px-1 pt-1 pb-1">
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
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-2 transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                  active && "bg-primary/15",
                )}
              >
                <Icon className={cn("h-[18px] w-[18px]", active && "stroke-[2.5]")} />
              </span>
              <span className="truncate text-[10px] font-medium leading-none">{short}</span>
            </Link>
          );
        })}
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-2 transition-colors",
            pathname.startsWith("/dashboard/settings") ||
              pathname.startsWith("/dashboard/campaigns") ||
              pathname.startsWith("/dashboard/contacts")
              ? "text-primary"
              : "text-muted-foreground",
          )}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full">
            <Menu className="h-[18px] w-[18px]" />
          </span>
          <span className="text-[10px] font-medium leading-none">Menu</span>
        </Link>
      </div>
    </nav>
  );
}
