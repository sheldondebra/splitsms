"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { ProviderSmsBalance } from "@/lib/sms/provider-balances";
import type { SmsProviderType } from "@/lib/generated/prisma/client";
import {
  refreshAllProviderBalancesJsonAction,
  refreshProviderBalanceJsonAction,
} from "@/lib/actions/admin-provider-balances";
import { AdminCard } from "@/components/admin/admin-page-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Wallet,
  Radio,
  Cloud,
  Globe,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MessageSquare,
  RefreshCw,
  History,
  Loader2,
} from "lucide-react";

const PROVIDER_ICONS = {
  MNOTIFY: Radio,
  TWILIO: Cloud,
  INFOBIP: Globe,
} as const;

function BalanceStatusIcon({ status }: { status: ProviderSmsBalance["status"] }) {
  if (status === "ok") return <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />;
  if (status === "unconfigured")
    return <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />;
  if (status === "error")
    return <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />;
  return <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />;
}

function ProviderBalanceCard({
  balance,
  refreshing,
  onRefresh,
}: {
  balance: ProviderSmsBalance;
  refreshing: boolean;
  onRefresh: (type: SmsProviderType) => void;
}) {
  const Icon = PROVIDER_ICONS[balance.type] ?? Wallet;

  return (
    <div
      className={cn(
        "rounded-xl border p-4 space-y-2",
        balance.status === "ok"
          ? "border-emerald-500/25 bg-emerald-500/5"
          : balance.status === "error"
            ? "border-amber-500/30 bg-amber-500/5"
            : "border-border/60 bg-muted/15",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{balance.name}</p>
            <p className="text-[10px] font-mono text-muted-foreground">{balance.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <BalanceStatusIcon status={balance.status} />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={refreshing || balance.status === "unconfigured"}
            title={
              balance.status === "unconfigured"
                ? "Configure this provider first"
                : `Check ${balance.name} balance`
            }
            onClick={() => onRefresh(balance.type)}
          >
            {refreshing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            <span className="sr-only">Check {balance.name} balance</span>
          </Button>
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        {balance.type === "MNOTIFY" ? (
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <Wallet className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
        <p
          className={cn(
            "text-lg font-bold tabular-nums tracking-tight",
            balance.status === "ok" && "text-foreground",
            balance.status === "error" && "text-amber-800 dark:text-amber-200 text-base",
            balance.status === "unconfigured" && "text-muted-foreground text-base font-medium",
          )}
        >
          {balance.display}
        </p>
      </div>
      {balance.bonus != null && balance.bonus > 0 && balance.status === "ok" && (
        <p className="text-xs text-muted-foreground">
          Bonus / free credit: {balance.bonus.toLocaleString()}
        </p>
      )}
      {balance.hint && (
        <p className="text-[11px] text-muted-foreground leading-snug">{balance.hint}</p>
      )}
      {balance.error && (
        <p className="text-[11px] text-destructive leading-snug" title={balance.error}>
          {balance.error}
        </p>
      )}
    </div>
  );
}

export function ProviderBalancesPanel({
  balances: initialBalances,
  compact,
}: {
  balances: ProviderSmsBalance[];
  compact?: boolean;
}) {
  const [balances, setBalances] = useState(initialBalances);
  const [pendingType, setPendingType] = useState<SmsProviderType | "ALL" | null>(null);
  const [isPending, startTransition] = useTransition();

  const [prevInitialBalances, setPrevInitialBalances] = useState(initialBalances);
  if (initialBalances !== prevInitialBalances) {
    setPrevInitialBalances(initialBalances);
    setBalances(initialBalances);
  }

  function refreshOne(type: SmsProviderType) {
    setPendingType(type);
    startTransition(async () => {
      const result = await refreshProviderBalanceJsonAction(type);
      setPendingType(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setBalances((prev) => prev.map((b) => (b.type === type ? result.balance : b)));
      toast.success(`${result.balance.name}: ${result.balance.display}`);
    });
  }

  function refreshAll() {
    setPendingType("ALL");
    startTransition(async () => {
      const result = await refreshAllProviderBalancesJsonAction();
      setPendingType(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setBalances(result.balances);
      toast.success("Provider balances updated");
    });
  }

  const refreshingAll = isPending && pendingType === "ALL";

  return (
    <AdminCard
      title="Provider SMS balances"
      description="Live upstream balances from mNotify, Twilio, and Infobip. Use each card’s refresh to check that provider."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/balances"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border/60 px-2.5 text-xs font-medium hover:bg-muted/40"
          >
            <History className="h-3.5 w-3.5" />
            Balance history
          </Link>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 h-8"
            disabled={isPending}
            onClick={refreshAll}
          >
            {refreshingAll ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Refresh all
          </Button>
        </div>
      }
    >
      <div className={cn("grid gap-3", compact ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3")}>
        {balances.map((b) => (
          <ProviderBalanceCard
            key={b.type}
            balance={b}
            refreshing={isPending && (pendingType === b.type || pendingType === "ALL")}
            onRefresh={refreshOne}
          />
        ))}
      </div>
    </AdminCard>
  );
}
