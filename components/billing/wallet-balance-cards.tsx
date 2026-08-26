import Link from "next/link";
import { Wallet, MessageSquare, Send, Receipt, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatWalletMoney } from "@/lib/billing/sms-packages";

type WalletBalanceCardsProps = {
  currency: string;
  walletBalance: number;
  smsCredits: number;
  lowBalance?: boolean;
  pricePerCredit?: number;
  pricingCurrency?: string;
  countryCode?: string;
};

export function WalletBalanceCards({
  currency,
  walletBalance,
  smsCredits,
  lowBalance,
  pricePerCredit,
  pricingCurrency,
  countryCode,
}: WalletBalanceCardsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/12 via-card to-card p-6 shadow-sm lg:col-span-1">
        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          Wallet balance
        </p>
        <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">
          {formatWalletMoney(walletBalance, currency)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Add money via Paystack or card
        </p>
      </div>

      <div
        className={cn(
          "rounded-2xl border p-6 shadow-sm lg:col-span-1",
          lowBalance
            ? "border-amber-300/60 bg-amber-50/50 dark:border-amber-800/40 dark:bg-amber-950/20"
            : "border-border/60 bg-card",
        )}
      >
        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          SMS credits
        </p>
        <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">
          {smsCredits.toLocaleString()}
        </p>
        {lowBalance ? (
          <p className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-300">
            Running low — buy a package below to keep sending
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            1 credit = 1 SMS segment when you send
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm lg:col-span-1">
        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Your SMS rate
        </p>
        {pricePerCredit != null ? (
          <>
            <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight">
              {formatWalletMoney(pricePerCredit, pricingCurrency ?? currency)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              per credit{countryCode ? ` · ${countryCode}` : ""}
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Rates load from your pricing country</p>
        )}
        <Link
          href="/dashboard/pricing"
          className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline"
        >
          Compare country rates →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:col-span-3">
        <Link
          href="/dashboard/send"
          className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/20"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Send className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">Send SMS</span>
            <span className="mt-0.5 block text-sm font-normal leading-relaxed text-muted-foreground">
              Use your credits
            </span>
          </span>
        </Link>

        <Link
          href="/dashboard/transactions"
          className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/20"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Receipt className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">Transaction history</span>
            <span className="mt-0.5 block text-sm font-normal leading-relaxed text-muted-foreground">
              Wallet top-ups, credit purchases, and SMS debits
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}
