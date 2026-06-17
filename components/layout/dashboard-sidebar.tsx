"use client";

import { Logo } from "@/components/brand/logo";
import { SidebarNavContent } from "@/components/dashboard/sidebar-nav-content";
import { useTheme } from "@/components/theme-provider";

export function DashboardSidebar() {
  const { resolvedTheme } = useTheme();

  return (
    <aside className="hidden w-[260px] shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:flex md:h-[100dvh] md:flex-col">
      <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border/80 px-5">
        <Logo
          href="/dashboard"
          size="sm"
          variant={resolvedTheme === "dark" ? "white" : "default"}
        />
      </div>
      <SidebarNavContent />
    </aside>
  );
}
