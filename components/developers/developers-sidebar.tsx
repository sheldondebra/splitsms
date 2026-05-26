"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { DevelopersNavContent } from "@/components/developers/developers-nav-content";
import { useTheme } from "@/components/theme-provider";
import { Code2 } from "lucide-react";

export function DevelopersSidebar() {
  const { resolvedTheme } = useTheme();

  return (
    <aside className="hidden w-[260px] shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:flex md:h-[100dvh] md:flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border/80 px-4">
        <Link href="/developers" className="flex items-center gap-2.5 min-w-0">
          <Logo
            href="/developers"
            size="sm"
            variant={resolvedTheme === "dark" ? "white" : "default"}
          />
        </Link>
        <span className="inline-flex items-center gap-1 rounded-lg bg-sidebar-primary/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-sidebar-primary">
          <Code2 className="h-3 w-3" />
          API
        </span>
      </div>
      <DevelopersNavContent />
    </aside>
  );
}
