import Link from "next/link";
import { ArrowUpRight, Send } from "lucide-react";
import type { BalanceSnapshot } from "@/lib/dashboard/balance-snapshot";
import { formatWalletMoney } from "@/lib/billing/sms-packages";
import { cn } from "@/lib/utils";

type DashboardWelcomeHeroProps = {
  firstName: string;
  balance: BalanceSnapshot;
};

export function DashboardWelcomeHero({ firstName, balance }: DashboardWelcomeHeroProps) {
  const { creditBalance, walletBalance, walletCurrency, lowBalance } = balance;

  return (
    <section className="overflow-hidden rounded-[1.35rem] border border-border/50 bg-card">
      <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="min-w-0">
          <p className="text-[13px] leading-none text-muted-foreground">Welcome back</p>
          <h1 className="mt-1 truncate text-[1.35rem] font-semibold tracking-tight leading-tight">
            {firstName}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/dashboard/wallet"
            className="hidden h-9 items-center rounded-full border border-border/70 px-3.5 text-[13px] font-semibold transition-colors hover:bg-muted/60 sm:inline-flex"
          >
            Top up
          </Link>
          <Link
            href="/dashboard/send"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:px-4"
          >
            <Send className="h-3.5 w-3.5" />
            <span className="sm:hidden">Send</span>
            <span className="hidden sm:inline">Send SMS</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-border/50">
        <Link
          href="/dashboard/wallet"
          className={cn(
            "bg-card px-4 py-3.5 transition-colors hover:bg-muted/40 sm:px-5 sm:py-4",
            lowBalance && "bg-amber-500/[0.07] hover:bg-amber-500/10",
          )}
        >
          <p
            className={cn(
              "text-[11px] font-medium",
              lowBalance ? "text-amber-800/80 dark:text-amber-300/80" : "text-muted-foreground",
            )}
          >
            SMS credits
          </p>
          <p
            className={cn(
              "mt-1 text-[1.65rem] font-semibold tabular-nums tracking-tight leading-none sm:text-[1.85rem]",
              lowBalance && "text-amber-800 dark:text-amber-300",
            )}
          >
            {creditBalance.toLocaleString()}
          </p>
        </Link>

        <Link
          href="/dashboard/wallet"
          className="bg-card px-4 py-3.5 transition-colors hover:bg-muted/40 sm:px-5 sm:py-4"
        >
          <p className="text-[11px] font-medium text-muted-foreground">Wallet</p>
          <p className="mt-1 text-[1.65rem] font-semibold tabular-nums tracking-tight leading-none sm:text-[1.85rem]">
            {formatWalletMoney(walletBalance, walletCurrency)}
          </p>
          <span className="mt-2 inline-flex items-center gap-0.5 text-[12px] font-semibold text-primary sm:hidden">
            Top up
            <ArrowUpRight className="h-3 w-3" />
          </span>
        </Link>
      </div>
    </section>
  );
}
