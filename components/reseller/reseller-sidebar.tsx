"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wallet,
  DollarSign,
  FileText,
  Settings,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/reseller", label: "Overview", icon: LayoutDashboard },
  { href: "/reseller/users", label: "Sub-users", icon: Users },
  { href: "/reseller/wallet", label: "Wallet", icon: Wallet },
  { href: "/reseller/transactions", label: "Transactions", icon: ScrollText },
  { href: "/reseller/pricing", label: "Pricing", icon: DollarSign },
  { href: "/reseller/reports", label: "Reports", icon: FileText },
  { href: "/reseller/settings", label: "White-label", icon: Settings },
];

export function ResellerSidebar({
  brandName,
  primaryColor,
}: {
  brandName?: string | null;
  primaryColor?: string | null;
}) {
  const pathname = usePathname();
  const accent = primaryColor ?? "#f97316";

  return (
    <aside
      className="hidden w-64 shrink-0 border-r md:flex md:flex-col text-sidebar-foreground"
      style={{
        backgroundColor: "var(--reseller-sidebar, #0f0f0f)",
        borderColor: `${accent}33`,
      }}
    >
      <div
        className="flex h-16 items-center border-b px-5 font-bold tracking-tight"
        style={{ borderColor: `${accent}33`, color: accent }}
      >
        {brandName ?? "Reseller Portal"}
      </div>
      <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || (href !== "/reseller" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "text-white shadow-sm" : "text-white/60 hover:text-white hover:bg-white/5",
              )}
              style={active ? { backgroundColor: accent } : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10 text-xs text-white/40">
        Powered by SplitSMS
      </div>
    </aside>
  );
}
