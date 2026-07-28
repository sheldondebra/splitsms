"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DollarSign,
  FileText,
  LayoutDashboard,
  ScrollText,
  Settings,
  Users,
  Wallet,
  X,
  Banknote,
  BadgeCheck,
  CreditCard,
  Tag,
} from "lucide-react";
import { ResellerSidebar } from "@/components/reseller/reseller-sidebar";
import { ResellerHeader } from "@/components/reseller/reseller-header";
import { ResellerFooter } from "@/components/reseller/reseller-footer";
import type { HeaderAccountProfile } from "@/lib/user/header-account-types";
import type { BalanceSnapshot } from "@/lib/dashboard/balance-snapshot";
import { cn } from "@/lib/utils";

const mobileLinks = [
  { href: "/reseller", label: "Overview", icon: LayoutDashboard },
  { href: "/reseller/users", label: "Clients", icon: Users },
  { href: "/reseller/payments", label: "Payments", icon: CreditCard },
  { href: "/reseller/sender-ids", label: "Sender IDs", icon: BadgeCheck },
  { href: "/reseller/wallet", label: "Wallet", icon: Wallet },
  { href: "/reseller/promos", label: "Promos", icon: Tag },
  { href: "/reseller/payouts", label: "Payouts", icon: Banknote },
  { href: "/reseller/transactions", label: "Ledger", icon: ScrollText },
  { href: "/reseller/pricing", label: "Pricing", icon: DollarSign },
  { href: "/reseller/reports", label: "Reports", icon: FileText },
  { href: "/reseller/settings", label: "Settings", icon: Settings },
];

export function ResellerAppShell({
  children,
  profile,
  brandName,
  logoUrl,
  primaryColor,
  hideNav,
  balance,
}: {
  children: React.ReactNode;
  profile: HeaderAccountProfile;
  brandName?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  hideNav?: boolean;
  balance: BalanceSnapshot;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <div className="flex min-h-[100dvh] bg-background">
      <ResellerSidebar
        brandName={brandName}
        logoUrl={logoUrl}
        primaryColor={primaryColor}
        hideNav={hideNav}
      />

      <div className="flex min-w-0 w-full max-w-[100vw] flex-1 flex-col">
        <ResellerHeader
          profile={profile}
          brandName={brandName}
          balance={balance}
          onMenuOpen={hideNav ? undefined : () => setMenuOpen(true)}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8 xl:p-10">{children}</div>
        </main>

        <ResellerFooter brandName={brandName} />
      </div>

      {menuOpen && !hideNav ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(18rem,88vw)] flex-col bg-[var(--reseller-sidebar,#0f0f0f)] text-white shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
              <p className="truncate text-sm font-semibold">{brandName?.trim() || "Reseller"}</p>
              <button
                type="button"
                className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"
                onClick={() => setMenuOpen(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="border-b border-white/10 px-3 py-3">
              <Link
                href="/dashboard"
                className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2.5 text-sm font-medium text-white"
              >
                <span>Member portal</span>
                <span className="text-xs text-white/70 tabular-nums">
                  {balance.creditBalance.toLocaleString()} SMS
                </span>
              </Link>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {mobileLinks.map(({ href, label, icon: Icon }) => {
                const active =
                  pathname === href ||
                  (href !== "/reseller" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                      active ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}
