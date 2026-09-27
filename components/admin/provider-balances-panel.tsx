"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import type { ProviderSmsBalance } from "@/lib/sms/provider-balances";
import type { SmsProviderType } from "@/lib/generated/prisma/client";
import {
  refreshAllProviderBalancesJsonAction,
  refreshProviderBalanceJsonAction,
  setProviderEnabledJsonAction,
} from "@/lib/actions/admin-provider-balances";
import { AdminCard } from "@/components/admin/admin-page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Wallet,
  Radio,
  Cloud,
  Globe,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MessageSquare,
  RefreshCw,
  History,
  Loader2,
  PowerOff,
  Clock,
} from "lucide-react";

const PROVIDER_ICONS = {
  MNOTIFY: Radio,
  TWILIO: Cloud,
  INFOBIP: Globe,
  EASYSENDSMS: Send,
} as const;

function BalanceStatusIcon({ status }: { status: ProviderSmsBalance["status"] }) {
  if (status === "ok") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />;
  if (status === "disabled") return <PowerOff className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
  if (status === "unconfigured")
    return <XCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
  if (status === "error")
    return <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />;
  return <XCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
}

function statusLabel(status: ProviderSmsBalance["status"]) {
  if (status === "ok") return "Online";
  if (status === "disabled") return "Disabled";
  if (status === "unconfigured") return "Not set up";
  if (status === "error") return "Check failed";
  return status;
}

function formatCheckedAt(iso: string | null | undefined) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return {
    relative: formatDistanceToNow(date, { addSuffix: true }),
    absolute: format(date, "MMM d, yyyy · HH:mm"),
  };
}

function ProviderBalanceCard({
  balance,
  refreshing,
  toggling,
  onRefresh,
  onToggle,
}: {
  balance: ProviderSmsBalance;
  refreshing: boolean;
  toggling: boolean;
  onRefresh: (type: SmsProviderType) => void;
  onToggle: (type: SmsProviderType, enabled: boolean) => void;
}) {
  const Icon = PROVIDER_ICONS[balance.type] ?? Wallet;
  const enabled = balance.enabled ?? balance.status !== "disabled";
  const checked = formatCheckedAt(balance.checkedAt);
  const busy = refreshing || toggling;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border transition-colors",
        balance.status === "ok" && enabled
          ? "border-emerald-500/25 bg-emerald-500/[0.04]"
          : balance.status === "error"
            ? "border-amber-500/30 bg-amber-500/[0.04]"
            : balance.status === "disabled" || !enabled
              ? "border-border/50 bg-muted/10 opacity-90"
              : "border-border/60 bg-muted/15",
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
              enabled
                ? "bg-primary/10 text-primary ring-primary/15"
                : "bg-muted text-muted-foreground ring-border/60",
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="truncate text-sm font-semibold">{balance.name}</p>
              <Badge
                variant="outline"
                className={cn(
                  "gap-1 text-[10px] font-semibold",
                  balance.status === "ok" &&
                    enabled &&
                    "border-emerald-500/40 text-emerald-800 dark:text-emerald-300",
                  balance.status === "error" &&
                    "border-amber-500/40 text-amber-900 dark:text-amber-200",
                  (balance.status === "disabled" || !enabled) &&
                    "border-border text-muted-foreground",
                )}
              >
                <BalanceStatusIcon status={!enabled ? "disabled" : balance.status} />
                {!enabled ? "Disabled" : statusLabel(balance.status)}
              </Badge>
            </div>
            <p className="font-mono text-[10px] text-muted-foreground">{balance.type}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {enabled ? "On" : "Off"}
            </span>
            <Switch
              checked={enabled}
              disabled={busy}
              aria-label={`${enabled ? "Disable" : "Enable"} ${balance.name}`}
              onCheckedChange={(next) => onToggle(balance.type, next)}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={busy || balance.status === "unconfigured"}
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

      <div className="space-y-3 px-4 py-3.5">
        <div className="flex items-baseline gap-2">
          {balance.type === "MNOTIFY" || balance.type === "EASYSENDSMS" ? (
            <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <Wallet className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <p
            className={cn(
              "text-xl font-bold tabular-nums tracking-tight",
              balance.status === "ok" && enabled && "text-foreground",
              balance.status === "error" && "text-base text-amber-800 dark:text-amber-200",
              (balance.status === "unconfigured" ||
                balance.status === "disabled" ||
                !enabled) &&
                "text-base font-semibold text-muted-foreground",
            )}
          >
            {balance.display}
          </p>
        </div>

        {balance.bonus != null && balance.bonus > 0 && balance.status === "ok" ? (
          <p className="text-xs text-muted-foreground">
            Bonus / free credit: {balance.bonus.toLocaleString()}
          </p>
        ) : null}

        <div
          className="flex items-start gap-1.5 text-[11px] text-muted-foreground"
          title={checked?.absolute}
        >
          <Clock className="mt-0.5 h-3 w-3 shrink-0" />
          {checked ? (
            <span>
              Last checked <span className="font-medium text-foreground/80">{checked.relative}</span>
              <span className="text-muted-foreground/80"> · {checked.absolute}</span>
            </span>
          ) : (
            <span>Not checked yet — refresh to record a balance check</span>
          )}
        </div>

        {balance.hint ? (
          <p className="text-[11px] leading-snug text-muted-foreground">{balance.hint}</p>
        ) : null}
        {balance.error ? (
          <p className="text-[11px] leading-snug text-destructive" title={balance.error}>
            {balance.error}
          </p>
        ) : null}
      </div>
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
  const [togglingType, setTogglingType] = useState<SmsProviderType | null>(null);
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

  function toggleEnabled(type: SmsProviderType, enabled: boolean) {
    setTogglingType(type);
    startTransition(async () => {
      const result = await setProviderEnabledJsonAction(type, enabled);
      setTogglingType(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setBalances((prev) => prev.map((b) => (b.type === type ? result.balance : b)));
      toast.success(
        enabled ? `${result.balance.name} enabled` : `${result.balance.name} disabled`,
      );
    });
  }

  const refreshingAll = isPending && pendingType === "ALL";

  return (
    <AdminCard
      title="Provider SMS balances"
      description="Check upstream balances, see when each was last verified, and turn providers on or off."
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
            className="h-8 gap-1.5"
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
      <div
        className={cn(
          "grid gap-3",
          compact ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-4",
        )}
      >
        {balances.map((b) => (
          <ProviderBalanceCard
            key={b.type}
            balance={b}
            refreshing={isPending && (pendingType === b.type || pendingType === "ALL")}
            toggling={isPending && togglingType === b.type}
            onRefresh={refreshOne}
            onToggle={toggleEnabled}
          />
        ))}
      </div>
    </AdminCard>
  );
}
