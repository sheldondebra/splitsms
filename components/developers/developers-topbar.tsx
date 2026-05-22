"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, LayoutDashboard, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

const modes = [
  { id: "app", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "dev", href: "/developers", label: "Developers", icon: Code2 },
] as const;

export function DevelopersTopbar() {
  const pathname = usePathname();
  const inDevelopers = pathname.startsWith("/developers");

  return (
    <header className="hidden md:block sticky top-0 z-30 -mx-6 md:-mx-10 lg:-mx-12 px-6 md:px-10 lg:px-12 py-3 mb-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <nav
          className="inline-flex items-center rounded-xl border bg-muted/40 p-1 self-start sm:self-auto"
          aria-label="Switch portal"
        >
          {modes.map(({ id, href, label, icon: Icon }) => {
            const active = id === "dev" ? inDevelopers : !inDevelopers;
            return (
              <Link
                key={id}
                href={href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
