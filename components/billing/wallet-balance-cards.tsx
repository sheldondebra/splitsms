import Link from "next/link";
import { Wallet, MessageSquare, Send, Receipt, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
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
  const emptyWallet = walletBalance <= 0;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border/50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
                lowBalance
                  ? "bg-amber-500/12 text-amber-800 ring-amber-500/20 dark:text-amber-200"
                  : emptyWallet
                    ? "bg-primary/10 text-primary ring-primary/15"
                    : "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
              )}
            >
              <Wallet className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">
                {lowBalance
                  ? "SMS credits running low"
                  : emptyWallet
                    ? "Add money to start buying credits"
                    : "Wallet ready"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {lowBalance
                  ? "Top up or buy a package below so sending isn’t interrupted."
                  : "Pay with Paystack or card, then buy SMS credits at your rate."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="#wallet-topup"
              className={cn(buttonVariants({ size: "sm" }), "h-9 gap-1.5 rounded-xl")}
            >
              Add money
            </a>
            <Link
              href="/dashboard/send"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-9 gap-1.5 rounded-xl",
              )}
            >
              <Send className="h-3.5 w-3.5" />
              Send SMS
            </Link>
          </div>
        </div>

        <div className="grid sm:grid-cols-3">
          <div className="border-b border-border/50 bg-primary/[0.03] p-4 sm:border-b-0 sm:border-r">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                <Wallet className="h-3.5 w-3.5" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Wallet balance
              </p>
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight text-primary sm:text-3xl">
              {formatWalletMoney(walletBalance, currency)}
            </p>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Available to buy SMS credits
            </p>
          </div>

          <div
            className={cn(
              "border-b border-border/50 p-4 sm:border-b-0 sm:border-r",
              lowBalance && "bg-amber-500/[0.04]",
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg ring-1",
                  lowBalance
                    ? "bg-amber-500/12 text-amber-800 ring-amber-500/20 dark:text-amber-200"
                    : "bg-muted text-muted-foreground ring-border/60",
                )}
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                SMS credits
              </p>
            </div>
            <p
              className={cn(
                "mt-3 text-2xl font-bold tabular-nums tracking-tight sm:text-3xl",
                lowBalance && "text-amber-800 dark:text-amber-200",
              )}
            >
              {smsCredits.toLocaleString()}
            </p>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {lowBalance
                ? "Running low — buy a package below"
                : "1 credit = 1 SMS segment"}
            </p>
          </div>

          <div className="p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border/60">
                <TrendingUp className="h-3.5 w-3.5" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Your SMS rate
              </p>
            </div>
            {pricePerCredit != null ? (
              <>
                <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">
                  {formatWalletMoney(pricePerCredit, pricingCurrency ?? currency)}
                </p>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Per credit{countryCode ? ` · ${countryCode}` : ""}
                  {" · "}
                  <Link
                    href="/dashboard/pricing"
                    className="font-semibold text-primary hover:underline"
                  >
                    Compare rates
                  </Link>
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Rates load from your pricing country
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/dashboard/send"
          className="group flex items-center gap-3.5 rounded-2xl border border-border/60 bg-card px-4 py-3.5 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/20"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <Send className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">Send SMS</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Use your {smsCredits.toLocaleString()} credits
            </span>
          </span>
        </Link>

        <Link
          href="/dashboard/transactions"
          className="group flex items-center gap-3.5 rounded-2xl border border-border/60 bg-card px-4 py-3.5 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/20"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <Receipt className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">Transaction history</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Top-ups, credit buys, and SMS debits
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}
