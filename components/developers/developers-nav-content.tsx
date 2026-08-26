"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  developersNavItems,
  isDevelopersNavActive,
} from "@/lib/navigation/developers-nav";
import { useNavIconTip } from "@/components/layout/nav-icon-tip";
import { cn } from "@/lib/utils";

type DevelopersNavContentProps = {
  onNavigate?: () => void;
  showBack?: boolean;
  collapsed?: boolean;
};

export function DevelopersNavContent({
  onNavigate,
  showBack = true,
  collapsed = false,
}: DevelopersNavContentProps) {
  const pathname = usePathname();
  const tip = useNavIconTip(collapsed);

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {tip.node}
      <nav
        className={cn(
          "sidebar-scroll flex-1 overflow-y-auto overscroll-contain min-h-0",
          collapsed ? "px-2 py-3 space-y-0.5" : "px-3 py-4 space-y-1",
        )}
      >
        {collapsed ? null : (
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/45">
            Developer portal
          </p>
        )}
        <ul className="space-y-0.5">
          {developersNavItems.map(({ href, label, icon: Icon, exact, accent }) => {
            const active = isDevelopersNavActive(pathname, href, exact);
            const isPostman = accent === "postman";
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-label={label}
                  className={cn(
                    "flex items-center rounded-xl text-sm font-medium transition-colors touch-target-lg",
                    collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    isPostman && !active && "hover:text-[#FF6C37]",
                  )}
                  onMouseEnter={(e) => tip.show(e, label)}
                  onMouseLeave={tip.hide}
                  onFocus={(e) => tip.show(e, label)}
                  onBlur={tip.hide}
                >
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      isPostman && !active && "text-[#FF6C37]/90",
                    )}
                  />
                  {collapsed ? <span className="sr-only">{label}</span> : label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {showBack && (
        <div className={cn("sidebar-footer border-t border-sidebar-border/80 safe-bottom", collapsed ? "p-2" : "p-3")}>
          <Link
            href="/dashboard"
            onClick={onNavigate}
            aria-label="Back to dashboard"
            className={cn(
              "flex items-center rounded-xl text-sm font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors",
              collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
            )}
            onMouseEnter={(e) => tip.show(e, "Back to dashboard")}
            onMouseLeave={tip.hide}
            onFocus={(e) => tip.show(e, "Back to dashboard")}
            onBlur={tip.hide}
          >
            <ArrowLeft className="h-[18px] w-[18px] shrink-0" />
            {collapsed ? <span className="sr-only">Back to dashboard</span> : "Back to dashboard"}
          </Link>
        </div>
      )}
    </div>
  );
}
