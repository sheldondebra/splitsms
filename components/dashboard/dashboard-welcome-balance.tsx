import Link from "next/link";
import { MessageSquare, Plus, Wallet } from "lucide-react";
import type { BalanceSnapshot } from "@/lib/dashboard/balance-snapshot";
import { cn } from "@/lib/utils";

type DashboardWelcomeBalanceProps = {
  balance: BalanceSnapshot;
  className?: string;
};

export function DashboardWelcomeBalance({ balance, className }: DashboardWelcomeBalanceProps) {
  const { creditBalance, walletBalance, walletCurrency, lowBalance } = balance;

  return (
    <div className={cn("mt-2 flex flex-wrap items-center gap-2", className)}>
      <Link
        href="/dashboard/wallet"
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors hover:bg-muted/50",
          lowBalance
            ? "border-amber-500/35 bg-amber-500/8"
            : "border-primary/20 bg-primary/[0.06]",
        )}
      >
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            lowBalance ? "bg-amber-500/15" : "bg-primary/12",
          )}
        >
          <MessageSquare
            className={cn(
              "h-4 w-4",
              lowBalance ? "text-amber-700 dark:text-amber-400" : "text-primary",
            )}
          />
        </span>
        <span className="min-w-0 text-left leading-tight">
          <span
            className={cn(
              "block text-base font-bold tabular-nums tracking-tight",
              lowBalance && "text-amber-800 dark:text-amber-300",
            )}
          >
            {creditBalance.toLocaleString()}
          </span>
          <span className="block text-[11px] font-medium text-muted-foreground">SMS credits</span>
        </span>
      </Link>

      <Link
        href="/dashboard/wallet"
        className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-muted/25 px-3 py-2 transition-colors hover:bg-muted/50"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/80">
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </span>
        <span className="min-w-0 text-left leading-tight">
          <span className="block text-base font-bold tabular-nums tracking-tight text-foreground">
            {walletCurrency} {walletBalance.toFixed(2)}
          </span>
          <span className="block text-[11px] font-medium text-muted-foreground">Wallet balance</span>
        </span>
      </Link>

      <Link
        href="/dashboard/wallet"
        className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-dashed border-primary/35 px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
      >
        <Plus className="h-3.5 w-3.5" />
        Top up
      </Link>
    </div>
  );
}
