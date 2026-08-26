"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Home, LayoutGrid, Send, Wallet, type LucideIcon } from "lucide-react";
import { isNavActive } from "@/lib/navigation/dashboard-nav";
import { cn } from "@/lib/utils";

type MobileNavProps = {
  onMenuOpen: () => void;
  onTabNavigate?: () => void;
  menuOpen?: boolean;
};

const TABS: { href: string; label: string; icon: LucideIcon; action?: boolean }[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/forms", label: "Forms", icon: FileText },
  { href: "/dashboard/send", label: "Send", icon: Send, action: true },
  { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
];

export function MobileNav({ onMenuOpen, onTabNavigate, menuOpen = false }: MobileNavProps) {
  const pathname = usePathname();
  const moreActive =
    menuOpen ||
    !TABS.some((tab) => isNavActive(pathname, tab.href));

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] md:hidden select-none"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="pointer-events-auto mx-3">
        <div className="grid h-[3.75rem] grid-cols-5 items-stretch overflow-visible rounded-[1.35rem] border border-border/50 bg-background/85 px-0.5 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.32)] ring-1 ring-black/[0.04] backdrop-blur-2xl dark:ring-white/[0.06]">
          {TABS.map((tab) => {
            const active = !menuOpen && isNavActive(pathname, tab.href);
            const Icon = tab.icon;

            if (tab.action) {
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={onTabNavigate}
                  className="relative flex flex-col items-center justify-end pb-[7px]"
                >
                  <span
                    className={cn(
                      "absolute left-1/2 top-0 flex h-12 w-12 -translate-x-1/2 -translate-y-[18px] items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_18px_-4px] shadow-primary/40 transition-transform active:scale-95",
                      active && "ring-2 ring-primary/25 ring-offset-2 ring-offset-background",
                    )}
                  >
                    <Send className="h-5 w-5" />
                  </span>
                  <span
                    className={cn(
                      "h-3.5 text-[10px] font-medium leading-none tracking-tight",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {tab.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={onTabNavigate}
                className={cn(
                  "flex flex-col items-center justify-end gap-0.5 pb-[7px]",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    active && "bg-primary/12",
                  )}
                >
                  <Icon className={cn("h-[18px] w-[18px]", active && "stroke-[2.25]")} />
                </span>
                <span className="h-3.5 text-[10px] font-medium leading-none tracking-tight">
                  {tab.label}
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={onMenuOpen}
            className={cn(
              "flex flex-col items-center justify-end gap-0.5 pb-[7px]",
              moreActive ? "text-primary" : "text-muted-foreground",
            )}
            aria-label="More"
            aria-expanded={menuOpen}
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full",
                moreActive && "bg-primary/12",
              )}
            >
              <LayoutGrid className={cn("h-[18px] w-[18px]", moreActive && "stroke-[2.25]")} />
            </span>
            <span className="h-3.5 text-[10px] font-medium leading-none tracking-tight">
              More
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
