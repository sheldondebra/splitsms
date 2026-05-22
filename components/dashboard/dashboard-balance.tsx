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
  variant?: "header" | "hero";
};

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
              <p className="mt-1.5 text-2xl sm:text-3xl font-bold tabular-nums tracking-tight">
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
                  "mt-1.5 text-2xl sm:text-3xl font-bold tabular-nums tracking-tight",
                  lowBalance && "text-amber-600 dark:text-amber-400",
                )}
              >
                {creditBalance.toLocaleString()}
                <span className="text-base font-semibold text-muted-foreground ml-1.5">
                  credits
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 gap-2"
              onClick={reload}
              disabled={pending}
            >
              <RefreshCw
                className={cn("h-4 w-4", (spinning || pending) && "animate-spin")}
              />
              Reload
            </Button>
            <Link
              href="/dashboard/wallet"
              className={cn(
                buttonVariants({ size: "sm" }),
                "h-10 gap-2 font-semibold shadow-md shadow-primary/20 inline-flex items-center",
              )}
            >
              <Plus className="h-4 w-4" />
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

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
      <Link
        href="/dashboard/wallet"
        className={cn(
          "flex items-center gap-1.5 rounded-xl border bg-muted/40 px-2 py-1.5 sm:px-3 transition-colors hover:bg-muted/70",
          lowBalance && "border-amber-500/40 bg-amber-500/10",
        )}
        title="Wallet balance"
      >
        <Wallet className="h-3.5 w-3.5 text-primary shrink-0" />
        <div className="text-left leading-tight">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold hidden sm:block">
            Wallet
          </p>
          <p className="text-xs sm:text-sm font-bold tabular-nums whitespace-nowrap">
            {walletCurrency} {walletBalance.toFixed(2)}
          </p>
        </div>
      </Link>

      <Link
        href="/dashboard/wallet"
        className={cn(
          "flex items-center gap-1.5 rounded-xl border bg-muted/40 px-2 py-1.5 sm:px-3 transition-colors hover:bg-muted/70",
          lowBalance && "border-amber-500/40 bg-amber-500/10",
        )}
        title="SMS credits"
      >
        <MessageSquare
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            lowBalance ? "text-amber-600" : "text-primary",
          )}
        />
        <div className="text-left leading-tight">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold hidden sm:block">
            SMS
          </p>
          <p
            className={cn(
              "text-xs sm:text-sm font-bold tabular-nums whitespace-nowrap",
              lowBalance && "text-amber-700 dark:text-amber-400",
            )}
          >
            {creditBalance.toLocaleString()}
          </p>
        </div>
      </Link>

      <Link
        href="/dashboard/wallet"
        className={cn(
          buttonVariants({ size: "sm" }),
          "h-8 sm:h-9 px-2.5 sm:px-3 gap-1 font-semibold text-xs shadow-sm inline-flex items-center",
        )}
      >
        <Plus className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Top up</span>
      </Link>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
        onClick={reload}
        disabled={pending}
        aria-label="Reload balance"
        title="Reload balance"
      >
        <RefreshCw
          className={cn("h-4 w-4", (spinning || pending) && "animate-spin")}
        />
      </Button>
    </div>
  );
}
