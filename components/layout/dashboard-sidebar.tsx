"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import {
  LayoutDashboard,
  Send,
  Users,
  Megaphone,
  FileStack,
  Workflow,
  FileText,
  BadgeCheck,
  Wallet,
  Key,
  Code2,
  Settings,
  LifeBuoy,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/send", label: "Bulk Send", icon: Send },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/dashboard/contacts", label: "Contacts", icon: Users },
  { href: "/dashboard/templates", label: "Templates", icon: FileStack },
  { href: "/dashboard/automation", label: "Automation", icon: Workflow },
  { href: "/dashboard/reports", label: "Reports", icon: FileText },
  { href: "/dashboard/sender-ids", label: "Sender IDs", icon: BadgeCheck },
  { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
  { href: "/dashboard/transactions", label: "Transactions", icon: FileText },
  { href: "/dashboard/invoices", label: "Invoices", icon: FileText },
  { href: "/dashboard/api-keys", label: "API Keys", icon: Key },
  { href: "/developers", label: "Developers", icon: Code2 },
  { href: "/dashboard/api-logs", label: "API Logs", icon: ScrollText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/support", label: "Support", icon: LifeBuoy },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <Logo href="/dashboard" size="md" variant="white" />
      </div>
      <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active && "opacity-100")} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border text-xs text-sidebar-foreground/45">
        SplitSMS · Bulk SMS Platform
      </div>
    </aside>
  );
}
