"use client";

import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/brand/logo";
import { DevelopersNavContent } from "@/components/developers/developers-nav-content";
import { useTheme } from "@/components/theme-provider";
import { useMemberSidebarCollapsed } from "@/components/layout/member-sidebar-collapse";
import { SidebarRailToggle } from "@/components/layout/sidebar-rail-toggle";
import { Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function DevelopersSidebar() {
  const { resolvedTheme } = useTheme();
  const { collapsed, toggle } = useMemberSidebarCollapsed();

  return (
    <aside
      className={cn(
        "relative z-40 hidden shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:flex md:h-[100dvh] md:flex-col",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      <SidebarRailToggle collapsed={collapsed} onToggle={toggle} />
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-sidebar-border/80",
          collapsed ? "justify-center px-2" : "justify-between px-4",
        )}
      >
        {collapsed ? (
          <Link href="/developers" className="inline-flex" aria-label="SplitSMS developers">
            <Image src="/icon.png" alt="SplitSMS" width={32} height={32} className="h-8 w-8 rounded-lg" />
          </Link>
        ) : (
          <>
            <Logo
              href="/developers"
              size="sm"
              variant={resolvedTheme === "dark" ? "white" : "default"}
            />
            <span className="inline-flex items-center gap-1 rounded-lg bg-sidebar-primary/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-sidebar-primary">
              <Code2 className="h-3 w-3" />
              API
            </span>
          </>
        )}
      </div>
      <DevelopersNavContent collapsed={collapsed} />
    </aside>
  );
}
