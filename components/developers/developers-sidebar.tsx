"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Code2,
  BookOpen,
  Key,
  Webhook,
  ScrollText,
  LayoutDashboard,
  Braces,
  ArrowLeft,
  Puzzle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/developers", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/developers/docs", label: "API Reference", icon: BookOpen },
  { href: "/developers/api-keys", label: "API Keys", icon: Key },
  { href: "/developers/postman", label: "Postman", icon: Braces },
  { href: "/developers/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/developers/logs", label: "Request Logs", icon: ScrollText },
  { href: "/developers/integrations", label: "Integrations", icon: Puzzle },
];

export function DevelopersSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-[240px] shrink-0 border-b md:border-b-0 md:border-r bg-zinc-950 text-zinc-100 md:min-h-screen flex flex-col">
      <div className="px-5 py-5 border-b border-zinc-800">
        <Link href="/developers" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Code2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-sm">SplitSMS</span>
            <span className="block text-[10px] font-medium text-zinc-400 uppercase tracking-widest">
              Developers
            </span>
          </div>
        </Link>
      </div>
      <nav className="flex md:flex-col gap-0.5 p-3 overflow-x-auto md:overflow-visible">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          const isPostman = href === "/developers/postman";
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : isPostman
                    ? "text-zinc-300 hover:bg-zinc-900 hover:text-[#FF6C37]"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isPostman && !active && "text-[#FF6C37]/80")} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-3 border-t border-zinc-800">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Back to dashboard
        </Link>
      </div>
    </aside>
  );
}
