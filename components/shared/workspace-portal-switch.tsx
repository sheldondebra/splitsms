"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const modes = [
  { id: "member", href: "/dashboard", label: "Member", icon: LayoutDashboard },
  { id: "reseller", href: "/reseller", label: "Reseller", icon: Store },
] as const;

/** Switch between member dashboard and reseller workspace. */
export function WorkspacePortalSwitch({ className }: { className?: string }) {
  const pathname = usePathname();
  const inReseller = pathname.startsWith("/reseller");

  return (
    <nav
      className={cn(
        "inline-flex items-center rounded-full border border-border/60 bg-muted/30 p-0.5",
        className,
      )}
      aria-label="Switch workspace"
    >
      {modes.map(({ id, href, label, icon: Icon }) => {
        const active = id === "reseller" ? inReseller : !inReseller;
        return (
          <Link
            key={id}
            href={href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5 shrink-0" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
