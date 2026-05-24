"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wallet, MessageSquare, Plus, RefreshCw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BalanceSnapshot } from "@/lib/dashboard/balance-snapshot";

type DashboardBalanceProps = {
  snapshot: BalanceSnapshot;
  variant?: "header" | "hero" | "compact";
};

function BalancePill({
  snapshot,
  className,
}: {
  snapshot: BalanceSnapshot;
  className?: string;
}) {
  const { walletBalance, walletCurrency, creditBalance, lowBalance } = snapshot;

  return (
    <Link
      href="/dashboard/wallet"
      className={cn(
        "inline-flex items-center rounded-lg border bg-muted/30 text-xs transition-colors hover:bg-muted/60",
        lowBalance ? "border-amber-500/30 bg-amber-500/5" : "border-border/60",
        className,
      )}
      title="Wallet & SMS credits"
    >
      <span className="inline-flex items-center gap-1 px-2 py-1.5 border-r border-border/50">
        <Wallet className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden />
        <span className="font-semibold tabular-nums text-foreground whitespace-nowrap">
          {walletCurrency} {walletBalance.toFixed(2)}
        </span>
      </span>
      <span className="inline-flex items-center gap-1 px-2 py-1.5">
        <MessageSquare
          className={cn(
            "h-3 w-3 shrink-0",
            lowBalance ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground",
          )}
          aria-hidden
        />
        <span
          className={cn(
            "font-semibold tabular-nums whitespace-nowrap",
            lowBalance ? "text-amber-700 dark:text-amber-400" : "text-foreground",
          )}
        >
          {creditBalance.toLocaleString()}
          <span className="text-muted-foreground font-normal ml-0.5 hidden min-[380px]:inline">
            SMS
          </span>
        </span>
      </span>
    </Link>
  );
}

export function DashboardBalance({
  snapshot,
  variant = "header",
}: DashboardBalanceProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [spinning, setSpinning] = useState(false);

  function reload() {
    setSpinning(true);
    startTransition(() => {
      router.refresh();
      setTimeout(() => setSpinning(false), 600);
    });
  }

  const { walletBalance, walletCurrency, creditBalance, lowBalance } = snapshot;

  if (variant === "hero") {
    return (
      <div
        className={cn(
          "rounded-2xl border p-4 sm:p-5",
          lowBalance
            ? "border-amber-500/35 bg-gradient-to-br from-amber-500/10 via-card to-card"
            : "border-primary/25 bg-gradient-to-br from-primary/8 via-card to-card",
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-2 gap-4 sm:gap-8 flex-1">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5" />
                Wallet funds
              </p>
              <p className="mt-1.5 text-xl sm:text-2xl font-bold tabular-nums tracking-tight">
                {walletCurrency} {walletBalance.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                SMS balance
              </p>
              <p
                className={cn(
                  "mt-1.5 text-xl sm:text-2xl font-bold tabular-nums tracking-tight",
                  lowBalance && "text-amber-600 dark:text-amber-400",
                )}
              >
                {creditBalance.toLocaleString()}
                <span className="text-sm font-semibold text-muted-foreground ml-1.5">credits</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-2"
              onClick={reload}
              disabled={pending}
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", (spinning || pending) && "animate-spin")}
              />
              Reload
            </Button>
            <Link
              href="/dashboard/wallet"
              className={cn(
                buttonVariants({ size: "sm" }),
                "h-9 gap-2 font-semibold inline-flex items-center",
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              Top up
            </Link>
          </div>
        </div>
        {lowBalance && (
          <p className="text-xs text-amber-800 dark:text-amber-300 mt-3 pt-3 border-t border-amber-500/20">
            Low SMS balance — top up your wallet and buy credits to keep sending.
          </p>
        )}
      </div>
    );
  }

  if (variant === "compact") {
    return <BalancePill snapshot={snapshot} />;
  }

  return (
    <div className="flex items-center gap-1 min-w-0">
      <BalancePill snapshot={snapshot} className="min-w-0 max-w-full" />

      <Link
        href="/dashboard/wallet"
        className={cn(
          buttonVariants({ size: "sm", variant: "ghost" }),
          "h-8 w-8 p-0 shrink-0 text-primary hover:text-primary hover:bg-primary/10",
        )}
        title="Top up wallet"
        aria-label="Top up wallet"
      >
        <Plus className="h-4 w-4" />
      </Link>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground"
        onClick={reload}
        disabled={pending}
        aria-label="Reload balance"
        title="Reload balance"
      >
        <RefreshCw className={cn("h-3.5 w-3.5", (spinning || pending) && "animate-spin")} />
      </Button>
    </div>
  );
}
