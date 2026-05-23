import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Gift, RefreshCw, Settings2, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const TX_META: Record<
  string,
  { label: string; icon: LucideIcon; credit: boolean }
> = {
  WALLET_TOPUP: { label: "Added money", icon: ArrowDownLeft, credit: true },
  CREDIT_PURCHASE: { label: "Bought SMS credits", icon: ShoppingCart, credit: false },
  SMS_DEBIT: { label: "SMS sent", icon: ArrowUpRight, credit: false },
  REFUND: { label: "Refund", icon: RefreshCw, credit: true },
  ADMIN_ADJUSTMENT: { label: "Balance adjustment", icon: Settings2, credit: true },
  PROMO_CREDIT: { label: "Promo bonus", icon: Gift, credit: true },
};

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
          const meta = TX_META[t.type] ?? {
            label: t.type.replace(/_/g, " ").toLowerCase(),
            icon: ArrowUpRight,
            credit: false,
          };
          const Icon = meta.icon;
          const amount = Math.abs(t.amount.toNumber());
          const isCredit = meta.credit;

          return (
            <li
              key={t.id}
              className="flex items-center gap-4 rounded-xl px-3 py-4 sm:px-4 hover:bg-muted/40 transition-colors"
            >
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                  isCredit ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground",
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
                  isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
                )}
              >
                {isCredit ? "+" : "−"}
                {t.currency} {amount.toFixed(2)}
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
