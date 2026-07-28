"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Store } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ResellerAccountMenu } from "@/components/reseller/reseller-account-menu";
import { DashboardBalance } from "@/components/dashboard/dashboard-balance";
import { WorkspacePortalSwitch } from "@/components/shared/workspace-portal-switch";
import type { HeaderAccountProfile } from "@/lib/user/header-account-types";
import type { BalanceSnapshot } from "@/lib/dashboard/balance-snapshot";
import { Button } from "@/components/ui/button";

const PAGE_TITLES: { prefix: string; title: string; subtitle: string }[] = [
  { prefix: "/reseller/users", title: "Clients", subtitle: "Manage and fund your members" },
  { prefix: "/reseller/payments", title: "Payments", subtitle: "Client top-ups and payment details" },
  { prefix: "/reseller/sender-ids", title: "Sender IDs", subtitle: "Approved, pending, and rejected names" },
  { prefix: "/reseller/wallet", title: "Wallet", subtitle: "Top up, buy SMS packages, and fund clients" },
  { prefix: "/reseller/promos", title: "Promos", subtitle: "Bonus codes for your clients" },
  { prefix: "/reseller/payouts", title: "Payouts", subtitle: "Request withdrawals and track history" },
  { prefix: "/reseller/transactions", title: "Ledger", subtitle: "Wallet and commission history" },
  { prefix: "/reseller/pricing", title: "Pricing", subtitle: "Set country sell rates" },
  { prefix: "/reseller/reports", title: "Reports", subtitle: "Usage and delivery insights" },
  { prefix: "/reseller/settings", title: "Settings", subtitle: "Brand, domain, payments, and payout details" },
  { prefix: "/reseller", title: "Overview", subtitle: "Your reseller command center" },
];

function getResellerPageMeta(pathname: string) {
  return (
    PAGE_TITLES.find((item) =>
      item.prefix === "/reseller" ? pathname === "/reseller" : pathname.startsWith(item.prefix),
    ) ?? PAGE_TITLES[PAGE_TITLES.length - 1]
  );
}

export function ResellerHeader({
  profile,
  brandName,
  balance,
  onMenuOpen,
}: {
  profile: HeaderAccountProfile;
  brandName?: string | null;
  balance: BalanceSnapshot;
  onMenuOpen?: () => void;
}) {
  const pathname = usePathname();
  const meta = getResellerPageMeta(pathname);
  const brand = brandName?.trim() || "Reseller Portal";

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/70 bg-background/95 px-4 backdrop-blur-md md:hidden">
        <div className="flex min-w-0 items-center gap-2">
          {onMenuOpen ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              onClick={onMenuOpen}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          ) : null}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{meta.title}</p>
            <p className="truncate text-[11px] text-muted-foreground">{brand}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href="/dashboard/wallet"
            className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 px-2 py-1 text-[11px] font-semibold tabular-nums"
            title="SMS balance"
          >
            <span className="text-muted-foreground font-normal">SMS</span>
            {balance.creditBalance.toLocaleString()}
          </Link>
          <ThemeToggle className="h-8 w-8 rounded-lg" />
          <ResellerAccountMenu profile={profile} variant="compact" />
        </div>
      </header>

      <header className="sticky top-0 z-30 hidden h-14 shrink-0 items-center justify-between gap-4 border-b border-border/70 bg-background/95 px-6 backdrop-blur-md md:flex lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Store className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">{meta.title}</p>
            <p className="truncate text-xs text-muted-foreground">{meta.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <DashboardBalance snapshot={balance} variant="compact" />
          <WorkspacePortalSwitch />
          <ThemeToggle className="h-9 w-9 rounded-lg shrink-0" />
          <ResellerAccountMenu profile={profile} variant="pill" />
        </div>
      </header>
    </>
  );
}
