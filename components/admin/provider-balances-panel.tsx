import type { ProviderSmsBalance } from "@/lib/sms/provider-balances";
import { refreshProviderBalancesAction } from "@/lib/actions/admin-provider-balances";
import { AdminCard } from "@/components/admin/admin-page-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import {
  Wallet,
  Radio,
  Cloud,
  Globe,
  CheckCircle2,
  XCircle,
  AlertTriangle,
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

export function ProviderBalancesPanel({
  balances,
  compact,
}: {
  balances: ProviderSmsBalance[];
  compact?: boolean;
}) {
  return (
    <AdminCard
      title="Provider SMS balances"
      description="Live upstream balances from mNotify, Twilio, and Infobip. Reload the page after sending a test SMS to refresh mNotify credit."
      actions={
        <form action={refreshProviderBalancesAction}>
          <Button type="submit" variant="outline" size="sm" className="gap-1.5 h-8">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </form>
      }
    >
      <div className={cn("grid gap-3", compact ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3")}>
        {balances.map((b) => {
          const Icon = PROVIDER_ICONS[b.type] ?? Wallet;
          return (
            <div
              key={b.type}
              className={cn(
                "rounded-xl border p-4 space-y-2",
                b.status === "ok"
                  ? "border-emerald-500/25 bg-emerald-500/5"
                  : b.status === "error"
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
                    <p className="font-semibold text-sm truncate">{b.name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{b.type}</p>
                  </div>
                </div>
                <BalanceStatusIcon status={b.status} />
              </div>
              <div className="flex items-baseline gap-2">
                <Wallet className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <p
                  className={cn(
                    "text-lg font-bold tabular-nums tracking-tight",
                    b.status === "ok" && "text-foreground",
                    b.status === "error" && "text-amber-800 dark:text-amber-200 text-base",
                    b.status === "unconfigured" && "text-muted-foreground text-base font-medium",
                  )}
                >
                  {b.display}
                </p>
              </div>
              {b.bonus != null && b.bonus > 0 && b.status === "ok" && (
                <p className="text-xs text-muted-foreground">
                  Bonus / free credit: {b.bonus.toLocaleString()}
                  {b.currency ? ` ${b.currency}` : ""}
                </p>
              )}
              {b.hint && (
                <p className="text-[11px] text-muted-foreground leading-snug">{b.hint}</p>
              )}
              {b.error && (
                <p className="text-[11px] text-destructive leading-snug" title={b.error}>
                  {b.error}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </AdminCard>
  );
}
