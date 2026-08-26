"use client";

import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/brand/logo";
import { SidebarNavContent } from "@/components/dashboard/sidebar-nav-content";
import { useTheme } from "@/components/theme-provider";
import { useMemberSidebarCollapsed } from "@/components/layout/member-sidebar-collapse";
import { SidebarRailToggle } from "@/components/layout/sidebar-rail-toggle";
import { cn } from "@/lib/utils";

export function DashboardSidebar() {
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
          collapsed ? "justify-center px-2" : "px-5",
        )}
      >
        {collapsed ? (
          <Link href="/dashboard" className="inline-flex" aria-label="SplitSMS home">
            <Image src="/icon.png" alt="SplitSMS" width={32} height={32} className="h-8 w-8 rounded-lg" />
          </Link>
        ) : (
          <Logo
            href="/dashboard"
            size="md"
            variant={resolvedTheme === "dark" ? "white" : "default"}
          />
        )}
      </div>
      <SidebarNavContent collapsed={collapsed} />
    </aside>
  );
}
