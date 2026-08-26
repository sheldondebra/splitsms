"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Code2, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const modes = [
  { id: "app", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "dev", href: "/developers", label: "Developers", icon: Code2 },
] as const;

export function PortalSwitch({
  className,
  showLabels = false,
}: {
  className?: string;
  showLabels?: boolean;
}) {
  const pathname = usePathname();
  const inDevelopers = pathname.startsWith("/developers");

  return (
    <nav
      className={cn(
        "inline-flex items-center rounded-lg border border-border/60 bg-muted/40 p-0.5",
        className,
      )}
      aria-label="Switch portal"
    >
      {modes.map(({ id, href, label, icon: Icon }) => {
        const active = id === "dev" ? inDevelopers : !inDevelopers;
        return (
          <Link
            key={id}
            href={href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors",
              showLabels && "flex-1 justify-center",
              active
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className={cn(showLabels ? "inline" : "hidden sm:inline")}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
