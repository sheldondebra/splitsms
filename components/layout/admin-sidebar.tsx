"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  DollarSign,
  BadgeCheck,
  Route,
  Radio,
  ScrollText,
  BarChart3,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/resellers", label: "Resellers", icon: Users },
  { href: "/admin/enterprise", label: "Enterprise", icon: Radio },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/pricing", label: "SMS Pricing", icon: DollarSign },
  { href: "/admin/billing", label: "Billing", icon: CreditCard },
  { href: "/admin/sender-ids", label: "Sender IDs", icon: BadgeCheck },
  { href: "/admin/routes", label: "Routes", icon: Route },
  { href: "/admin/mnotify", label: "mNotify Setup", icon: Radio },
  { href: "/admin/api-logs", label: "API Logs", icon: ScrollText },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/fraud", label: "Fraud", icon: ShieldAlert },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <Logo href="/admin" size="md" variant="white" />
      </div>
      <p className="px-5 pt-4 pb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
        Administration
      </p>
      <nav className="flex-1 space-y-0.5 px-3 pb-3 overflow-y-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/admin" && pathname.startsWith(href));
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
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border">
        <Link
          href="/dashboard"
          className="text-xs text-sidebar-foreground/55 hover:text-primary transition-colors"
        >
          ← Member dashboard
        </Link>
      </div>
    </aside>
  );
}
