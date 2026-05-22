"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Route,
  Radio,
  BarChart3,
  FileText,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/enterprise", label: "Overview", icon: LayoutDashboard },
  { href: "/enterprise/routes", label: "Dedicated routes", icon: Route },
  { href: "/enterprise/smpp", label: "Direct connection", icon: Radio },
  { href: "/enterprise/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/enterprise/reports", label: "Reports", icon: FileText },
  { href: "/enterprise/invoices", label: "Invoices", icon: Receipt },
];

export function EnterpriseSidebar({ companyName }: { companyName?: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5 font-bold tracking-tight text-primary">
        {companyName ?? "Enterprise"}
      </div>
      <p className="px-5 pt-4 pb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
        Enterprise portal
      </p>
      <nav className="flex-1 space-y-0.5 px-3 pb-3 overflow-y-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || (href !== "/enterprise" && pathname.startsWith(href));
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
    </aside>
  );
}
