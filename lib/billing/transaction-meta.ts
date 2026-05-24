import {
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  RefreshCw,
  Settings2,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";

export type TransactionMeta = {
  label: string;
  icon: LucideIcon;
  credit: boolean;
  filter: "in" | "out" | "neutral";
};

export const TX_META: Record<string, TransactionMeta> = {
  WALLET_TOPUP: { label: "Wallet top-up", icon: ArrowDownLeft, credit: true, filter: "in" },
  CREDIT_PURCHASE: { label: "Credit purchase", icon: ShoppingCart, credit: false, filter: "out" },
  SMS_DEBIT: { label: "SMS sent", icon: ArrowUpRight, credit: false, filter: "out" },
  REFUND: { label: "Refund", icon: RefreshCw, credit: true, filter: "in" },
  ADMIN_ADJUSTMENT: { label: "Balance adjustment", icon: Settings2, credit: true, filter: "in" },
  PROMO_CREDIT: { label: "Promo bonus", icon: Gift, credit: true, filter: "in" },
  RESELLER_SUB_FUND: { label: "Sub-user funding", icon: Users, credit: false, filter: "out" },
};

export type TransactionFilter = "all" | "in" | "out" | "sms" | "topup" | "refund";

export const TX_FILTER_OPTIONS: { value: TransactionFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in", label: "Money in" },
  { value: "out", label: "Money out" },
  { value: "topup", label: "Top-ups" },
  { value: "sms", label: "SMS" },
  { value: "refund", label: "Refunds" },
];

export function getTransactionMeta(type: string): TransactionMeta {
  return (
    TX_META[type] ?? {
      label: type.replace(/_/g, " ").toLowerCase(),
      icon: ArrowUpRight,
      credit: false,
      filter: "neutral" as const,
    }
  );
}

export function formatTxAmount(amount: number, currency: string, credit: boolean) {
  const n = Math.abs(amount);
  const formatted = n < 0.01 ? n.toFixed(4) : n.toFixed(2);
  return `${credit ? "+" : "−"}${currency} ${formatted}`;
}

export function matchesTransactionFilter(type: string, filter: TransactionFilter) {
  if (filter === "all") return true;
  const meta = getTransactionMeta(type);
  if (filter === "in") return meta.filter === "in";
  if (filter === "out") return meta.filter === "out";
  if (filter === "topup") return type === "WALLET_TOPUP" || type === "PROMO_CREDIT";
  if (filter === "sms") return type === "SMS_DEBIT";
  if (filter === "refund") return type === "REFUND";
  return true;
}

export function exportTransactionsCsv(
  rows: {
    id: string;
    type: string;
    amount: number;
    currency: string;
    credits: number | null;
    description: string | null;
    reference: string | null;
    status: string;
    createdAt: string;
  }[],
) {
  const header = "id,type,amount,currency,credits,status,reference,description,date\n";
  const body = rows
    .map((r) => {
      const desc = (r.description ?? "").replace(/"/g, '""');
      const ref = (r.reference ?? "").replace(/"/g, '""');
      return `${r.id},${r.type},${r.amount},${r.currency},${r.credits ?? ""},${r.status},"${ref}","${desc}",${r.createdAt}`;
    })
    .join("\n");
  return header + body;
}
