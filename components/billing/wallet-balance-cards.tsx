import Link from "next/link";
import { Wallet, MessageSquare, Send, Receipt } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WalletBalanceCardsProps = {
  currency: string;
  walletBalance: number;
  smsCredits: number;
  lowBalance?: boolean;
};

function formatMoney(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function WalletBalanceCards({
  currency,
  walletBalance,
  smsCredits,
  lowBalance,
}: WalletBalanceCardsProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 sm:auto-rows-fr">
      <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/12 via-card to-card p-6 shadow-sm sm:col-span-2 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-6">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Wallet balance
            </p>
            <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight sm:text-4xl lg:text-5xl">
              {formatMoney(walletBalance, currency)}
            </p>
            {lowBalance ? (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-3 font-medium leading-relaxed">
                Low balance — add funds to keep sending SMS
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Use this balance to buy SMS credits or pay for messages
              </p>
            )}
          </div>
          <div className="rounded-xl border border-border/60 bg-background/80 px-5 py-4 sm:self-start">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              SMS credits
            </p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-bold tabular-nums sm:text-3xl">
              <MessageSquare className="h-5 w-5 text-primary" />
              {smsCredits.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <Link
        href="/dashboard/send"
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-full min-h-[7.5rem] py-5 px-6 rounded-2xl flex flex-col items-start justify-center gap-3 border-border/60 hover:border-primary/30",
        )}
      >
        <Send className="h-5 w-5 text-primary" />
        <span className="font-semibold text-base">Send SMS</span>
        <span className="text-sm text-muted-foreground font-normal leading-relaxed">
          Use your credits
        </span>
      </Link>
      <Link
        href="/dashboard/transactions"
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-full min-h-[7.5rem] py-5 px-6 rounded-2xl flex flex-col items-start justify-center gap-3 border-border/60 hover:border-primary/30",
        )}
      >
        <Receipt className="h-5 w-5 text-primary" />
        <span className="font-semibold text-base">All transactions</span>
        <span className="text-sm text-muted-foreground font-normal leading-relaxed">
          Full history
        </span>
      </Link>
    </div>
  );
}
