import Link from "next/link";
import { getTransactionMeta, formatTxAmount } from "@/lib/billing/transaction-meta";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeftRight } from "lucide-react";

type Transaction = {
  id: string;
  type: string;
  amount: { toNumber: () => number };
  currency: string;
  createdAt: Date;
};

export function WalletRecentActivity({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 px-6 py-12 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground ring-1 ring-border/60">
          <ArrowLeftRight className="h-4 w-4" />
        </span>
        <p className="mt-4 text-sm font-medium">No activity yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Add money to your wallet to get started.
        </p>
        <a
          href="#wallet-topup"
          className={cn(buttonVariants({ size: "sm" }), "mt-5 h-9 rounded-xl")}
        >
          Add money
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-border/50 overflow-hidden rounded-xl border border-border/60">
        {transactions.map((t) => {
          const meta = getTransactionMeta(t.type);
          const Icon = meta.icon;
          const amount = Math.abs(t.amount.toNumber());

          return (
            <li
              key={t.id}
              className="flex items-center gap-3.5 px-3.5 py-3 transition-colors hover:bg-muted/30 sm:px-4"
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
                  meta.credit
                    ? "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300"
                    : "bg-muted text-muted-foreground ring-border/60",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{meta.label}</p>
                <p className="text-[11px] text-muted-foreground">
                  {t.createdAt.toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <p
                className={cn(
                  "shrink-0 text-sm font-semibold tabular-nums",
                  meta.credit
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-foreground",
                )}
              >
                {formatTxAmount(amount, t.currency, meta.credit)}
              </p>
            </li>
          );
        })}
      </ul>
      <div className="flex justify-center pt-1">
        <Link
          href="/dashboard/transactions"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-9 gap-1.5 rounded-xl",
          )}
        >
          View all transactions
        </Link>
      </div>
    </div>
  );
}
