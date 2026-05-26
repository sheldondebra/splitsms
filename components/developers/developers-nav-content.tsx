"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  developersNavItems,
  isDevelopersNavActive,
} from "@/lib/navigation/developers-nav";
import { cn } from "@/lib/utils";

type DevelopersNavContentProps = {
  onNavigate?: () => void;
  showBack?: boolean;
};

export function DevelopersNavContent({
  onNavigate,
  showBack = true,
}: DevelopersNavContentProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <nav className="sidebar-scroll flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-1 min-h-0">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/45">
          Developer portal
        </p>
        <ul className="space-y-0.5">
          {developersNavItems.map(({ href, label, icon: Icon, exact, accent }) => {
            const active = isDevelopersNavActive(pathname, href, exact);
            const isPostman = accent === "postman";
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors touch-target-lg",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    isPostman && !active && "hover:text-[#FF6C37]",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      isPostman && !active && "text-[#FF6C37]/90",
                    )}
                  />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {showBack && (
        <div className="sidebar-footer border-t border-sidebar-border/80 p-3 safe-bottom">
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <ArrowLeft className="h-[18px] w-[18px] shrink-0" />
            Back to dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
