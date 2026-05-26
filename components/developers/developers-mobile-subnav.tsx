"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  developersNavItems,
  isDevelopersNavActive,
} from "@/lib/navigation/developers-nav";
import { cn } from "@/lib/utils";

/** Horizontal nav for developers routes on mobile */
export function DevelopersMobileSubnav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden -mx-5 px-5 sm:-mx-6 sm:px-6 border-b border-border/60 bg-background/95 backdrop-blur-sm sticky top-14 z-20">
      <div className="flex gap-2 overflow-x-auto py-3 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {developersNavItems.map(({ href, label, exact }) => {
          const active = isDevelopersNavActive(pathname, href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "snap-start shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/70 text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
