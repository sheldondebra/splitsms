import { format } from "date-fns";
import { AdminCard, AdminEmpty } from "@/components/admin/admin-page-shell";
import { formatTxAmount, getTransactionMeta } from "@/lib/billing/transaction-meta";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Tx = {
  id: string;
  type: string;
  amount: number | { toNumber: () => number };
  currency: string;
  credits: number | null;
  description: string | null;
  reference: string | null;
  status: string;
  createdAt: Date | string;
  metadata?: unknown;
};

function toAmount(value: Tx["amount"]): number {
  if (typeof value === "number") return value;
  if (value && typeof value.toNumber === "function") return value.toNumber();
  return Number(value) || 0;
}

function metadataDelta(metadata: unknown): number | null {
  if (!metadata || typeof metadata !== "object") return null;
  const delta = (metadata as { delta?: unknown }).delta;
  return typeof delta === "number" && Number.isFinite(delta) ? delta : null;
}

function formatAmount(t: Tx) {
  const meta = getTransactionMeta(t.type);
  const delta = metadataDelta(t.metadata);
  const amount = toAmount(t.amount);

  if (t.currency === "CREDITS" || (t.credits != null && amount === 0)) {
    const credits =
      delta != null ? Math.abs(delta) : Math.abs(t.credits ?? 0);
    const isCredit = delta != null ? delta > 0 : meta.credit;
    return {
      label: `${isCredit ? "+" : "−"}${credits.toLocaleString()} cr`,
      isCredit,
    };
  }

  const signed = delta ?? (meta.credit ? amount : -amount);
  const isCredit = signed >= 0;
  return {
    label: formatTxAmount(Math.abs(signed || amount), t.currency, isCredit),
    isCredit,
  };
}

export function MemberTransactionHistory({ transactions }: { transactions: Tx[] }) {
  return (
    <AdminCard
      title="Transaction history"
      description="Recent wallet and credit activity for this member"
    >
      {transactions.length === 0 ? (
        <AdminEmpty>No transactions yet.</AdminEmpty>
      ) : (
        <ul className="divide-y divide-border/40 max-h-[28rem] overflow-y-auto">
          {transactions.map((t) => {
            const meta = getTransactionMeta(t.type);
            const Icon = meta.icon;
            const { label: amountLabel, isCredit } = formatAmount(t);
            const createdAt =
              typeof t.createdAt === "string" ? new Date(t.createdAt) : t.createdAt;

            return (
              <li key={t.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <div
                  className={cn(
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    isCredit
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium">{meta.label}</p>
                    <p
                      className={cn(
                        "shrink-0 text-sm font-semibold tabular-nums",
                        isCredit
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-foreground",
                      )}
                    >
                      {amountLabel}
                    </p>
                  </div>
                  {t.description ? (
                    <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="tabular-nums">
                      {format(createdAt, "MMM d, yyyy · HH:mm")}
                    </span>
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                      {t.status}
                    </Badge>
                    {t.reference ? (
                      <span className="truncate font-mono text-[10px]">{t.reference}</span>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AdminCard>
  );
}
