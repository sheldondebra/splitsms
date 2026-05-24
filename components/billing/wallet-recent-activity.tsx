import Link from "next/link";
import { getTransactionMeta, formatTxAmount } from "@/lib/billing/transaction-meta";
import { cn } from "@/lib/utils";

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
      <p className="text-sm text-muted-foreground text-center py-14 px-6 rounded-2xl border border-dashed leading-relaxed">
        No activity yet. Add money to your wallet to get started.
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {transactions.map((t) => {
          const meta = getTransactionMeta(t.type);
          const Icon = meta.icon;
          const amount = Math.abs(t.amount.toNumber());

          return (
            <li
              key={t.id}
              className="flex items-center gap-4 rounded-xl px-3 py-4 sm:px-4 hover:bg-muted/40 transition-colors"
            >
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                  meta.credit
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{meta.label}</p>
                <p className="text-xs text-muted-foreground">
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
                  "text-sm font-semibold tabular-nums shrink-0",
                  meta.credit ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
                )}
              >
                {formatTxAmount(amount, t.currency, meta.credit)}
              </p>
            </li>
          );
        })}
      </ul>
      <Link
        href="/dashboard/transactions"
        className="block text-center text-sm font-semibold text-primary mt-6 py-3 hover:underline"
      >
        View all transactions →
      </Link>
    </>
  );
}
