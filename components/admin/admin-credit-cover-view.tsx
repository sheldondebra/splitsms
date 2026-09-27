import Link from "next/link";
import {
  AdminAlert,
  AdminCard,
  AdminEmpty,
} from "@/components/admin/admin-page-shell";
import {
  SaveCreditCoverThresholdButton,
  SendCreditCoverAlertButton,
} from "@/components/admin/credit-cover-buttons";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { saveCreditCoverThresholdAction, sendCreditCoverAlertAction } from "@/lib/actions/admin-credit-cover";
import { refreshProviderBalancesAction } from "@/lib/actions/admin-provider-balances";
import { isCreditCoverAlertable, type CreditCoverStatus } from "@/lib/admin/credit-cover";
import type { CreditCoverDashboard } from "@/lib/admin/credit-cover-dashboard";
import { cn } from "@/lib/utils";
import {
  BellRing,
  Cloud,
  Globe,
  History,
  Layers3,
  Mail,
  Radio,
  RefreshCw,
  Scale,
  Users,
  Wallet,
  Trophy,
} from "lucide-react";

function formatCredits(n: number) {
  return n.toLocaleString();
}

function holderHref(role: string, userId: string) {
  if (role === "RESELLER") return `/admin/resellers/${userId}`;
  if (role === "ENTERPRISE") return `/admin/enterprise`;
  return `/admin/members/${userId}`;
}

function roleLabel(role: string) {
  if (role === "RESELLER") return "Reseller";
  if (role === "ENTERPRISE") return "Enterprise";
  return "Member";
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function RankMark({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums ring-1",
          rank === 1 && "bg-amber-500/15 text-amber-800 ring-amber-500/25 dark:text-amber-200",
          rank === 2 && "bg-slate-400/15 text-slate-700 ring-slate-400/25 dark:text-slate-200",
          rank === 3 && "bg-orange-500/12 text-orange-800 ring-orange-500/20 dark:text-orange-200",
        )}
      >
        {rank}
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-xs font-semibold tabular-nums text-muted-foreground ring-1 ring-border/60">
      {rank}
    </span>
  );
}

function statusCopy(status: CreditCoverStatus) {
  if (status === "underwater") {
    return "Members hold more SMS credits than you have with the provider. Top up before they send.";
  }
  if (status === "low") {
    return "Main SMS stock is below your alert threshold.";
  }
  if (status === "unknown") {
    return "Could not read mNotify stock. Refresh balances, then check again.";
  }
  return "Provider stock covers member credits and sits above your threshold.";
}

export function AdminCreditCoverView({
  data,
  saved,
  error,
}: {
  data: CreditCoverDashboard;
  saved?: string;
  error?: string;
}) {
  const alertable = isCreditCoverAlertable(data.status);
  const coverLabel =
    data.cover == null
      ? "—"
      : data.cover >= 0
        ? `${formatCredits(data.cover)} surplus`
        : `${formatCredits(Math.abs(data.cover))} short`;
  const topHoldersTotal = data.topHolders.reduce((sum, row) => sum + row.credits, 0);
  const topHoldersLeader = data.topHolders[0]?.credits || 1;
  const topHoldersShareOfSold =
    data.memberCredits > 0
      ? Math.round((topHoldersTotal / data.memberCredits) * 1000) / 10
      : null;
  const scale = Math.max(data.memberCredits, data.providerCredits ?? 0, 1);
  const memberPct = Math.min(100, (data.memberCredits / scale) * 100);
  const providerPct =
    data.providerCredits == null ? 0 : Math.min(100, (data.providerCredits / scale) * 100);
  const thresholdHeadroom =
    data.providerCredits == null ? null : data.providerCredits - data.threshold;
  const stockBelowThreshold =
    data.providerCredits != null && data.providerCredits < data.threshold;

  return (
    <div className="space-y-6">
      {saved === "threshold" && (
        <AdminAlert variant="success">Low-balance threshold saved.</AdminAlert>
      )}
      {saved === "alert" && (
        <AdminAlert variant="success">
          Admins were notified by email, Slack, and SMS (office alert contacts).
        </AdminAlert>
      )}
      {error === "not-low" && (
        <AdminAlert variant="warning">
          Main SMS stock is not below the threshold, so the alert was not sent.
        </AdminAlert>
      )}

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border/50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
                data.status === "ok" &&
                  "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
                data.status === "low" &&
                  "bg-amber-500/12 text-amber-800 ring-amber-500/20 dark:text-amber-200",
                (data.status === "underwater" || data.status === "unknown") &&
                  "bg-destructive/12 text-destructive ring-destructive/20",
              )}
            >
              <Scale className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">
                {data.status === "ok"
                  ? "Cover is healthy"
                  : data.status === "low"
                    ? "Stock is below alert threshold"
                    : data.status === "underwater"
                      ? "Cover is underwater"
                      : "Provider stock unknown"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{statusCopy(data.status)}</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "w-fit shrink-0 gap-1 text-[10px] font-semibold",
              data.status === "ok" &&
                "border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
              data.status === "low" &&
                "border-amber-500/40 text-amber-800 dark:text-amber-200",
              (data.status === "underwater" || data.status === "unknown") &&
                "border-destructive/40 text-destructive",
            )}
          >
            {data.status === "underwater"
              ? "Underwater"
              : data.status === "low"
                ? "Low stock"
                : data.status === "unknown"
                  ? "Unknown"
                  : "Covered"}
          </Badge>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4">
          <div className="border-b border-border/50 p-4 sm:border-r xl:border-b-0">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                <Users className="h-3.5 w-3.5" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Sold credits
              </p>
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight text-primary">
              {formatCredits(data.memberCredits)}
            </p>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${memberPct}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Members · resellers · enterprise
            </p>
          </div>

          <Link
            href="/admin/providers"
            className={cn(
              "border-b border-border/50 p-4 transition-colors hover:bg-muted/30 xl:border-b-0 xl:border-r",
              data.status === "unknown" && "bg-amber-500/[0.04]",
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg ring-1",
                  data.status === "unknown"
                    ? "bg-amber-500/12 text-amber-800 ring-amber-500/20 dark:text-amber-200"
                    : "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
                )}
              >
                <Radio className="h-3.5 w-3.5" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Provider stock
              </p>
            </div>
            <p
              className={cn(
                "mt-3 text-2xl font-bold tabular-nums tracking-tight",
                data.status === "unknown"
                  ? "text-amber-800 dark:text-amber-200"
                  : "text-emerald-700 dark:text-emerald-300",
              )}
            >
              {data.providerCredits == null ? "—" : formatCredits(data.providerCredits)}
            </p>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full",
                  data.status === "unknown" ? "bg-amber-500" : "bg-emerald-600",
                )}
                style={{ width: `${providerPct}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {data.mnotify?.display ?? "mNotify main balance"}
            </p>
          </Link>

          <div
            className={cn(
              "border-b border-border/50 p-4 sm:border-r sm:border-b-0",
              data.status === "underwater" && "bg-destructive/[0.04]",
              data.status === "low" && "bg-amber-500/[0.04]",
              data.status === "ok" && "bg-emerald-500/[0.03]",
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg ring-1",
                  data.status === "underwater" &&
                    "bg-destructive/12 text-destructive ring-destructive/20",
                  data.status === "low" &&
                    "bg-amber-500/12 text-amber-800 ring-amber-500/20 dark:text-amber-200",
                  data.status === "ok" &&
                    "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
                  data.status === "unknown" &&
                    "bg-muted text-muted-foreground ring-border/60",
                )}
              >
                <Scale className="h-3.5 w-3.5" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Cover
              </p>
            </div>
            <p
              className={cn(
                "mt-3 text-2xl font-bold tabular-nums tracking-tight",
                data.cover != null && data.cover < 0 && "text-destructive",
                data.status === "ok" && "text-emerald-700 dark:text-emerald-300",
                data.status === "low" && "text-amber-800 dark:text-amber-200",
              )}
            >
              {coverLabel}
            </p>
            <p className="mt-2.5 text-[11px] text-muted-foreground">
              {data.cover == null
                ? "Stock minus sold credits"
                : data.cover >= 0
                  ? "Provider stock exceeds sold credits"
                  : "Sold credits exceed provider stock"}
            </p>
          </div>

          <div
            className={cn(
              "p-4",
              stockBelowThreshold && "bg-amber-500/[0.04]",
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg ring-1",
                  stockBelowThreshold
                    ? "bg-amber-500/12 text-amber-800 ring-amber-500/20 dark:text-amber-200"
                    : "bg-muted text-muted-foreground ring-border/60",
                )}
              >
                <BellRing className="h-3.5 w-3.5" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Alert line
              </p>
            </div>
            <p
              className={cn(
                "mt-3 text-2xl font-bold tabular-nums tracking-tight",
                stockBelowThreshold && "text-amber-800 dark:text-amber-200",
              )}
            >
              {formatCredits(data.threshold)}
            </p>
            <p className="mt-2.5 text-[11px] text-muted-foreground">
              {data.threshold === 0
                ? "Threshold off — set a value to arm alerts"
                : thresholdHeadroom == null
                  ? "Warn when stock falls below this"
                  : stockBelowThreshold
                    ? `${formatCredits(Math.abs(thresholdHeadroom))} under the alert line`
                    : `${formatCredits(thresholdHeadroom)} headroom above alert`}
            </p>
          </div>
        </div>
      </div>

      <AdminCard
        title="Member credits vs provider stock"
        description="How sold credits sit against mNotify stock — and who holds them."
        actions={
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 gap-1 text-[10px] font-semibold",
              data.status === "ok" &&
                "border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
              data.status === "low" &&
                "border-amber-500/40 text-amber-800 dark:text-amber-200",
              (data.status === "underwater" || data.status === "unknown") &&
                "border-destructive/40 text-destructive",
            )}
          >
            {data.status === "underwater"
              ? "Underwater"
              : data.status === "low"
                ? "Low stock"
                : data.status === "unknown"
                  ? "Unknown"
                  : "Covered"}
          </Badge>
        }
      >
        <div className="space-y-4">
          <div
            className={cn(
              "flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
              data.status === "ok" && "border-emerald-500/25 bg-emerald-500/[0.04]",
              data.status === "low" && "border-amber-500/30 bg-amber-500/[0.05]",
              (data.status === "underwater" || data.status === "unknown") &&
                "border-destructive/30 bg-destructive/[0.05]",
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
                  data.status === "ok" &&
                    "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
                  data.status === "low" &&
                    "bg-amber-500/12 text-amber-800 ring-amber-500/20 dark:text-amber-200",
                  (data.status === "underwater" || data.status === "unknown") &&
                    "bg-destructive/12 text-destructive ring-destructive/20",
                )}
              >
                <Scale className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold">
                  {data.status === "ok"
                    ? "Stock covers sold credits"
                    : data.status === "low"
                      ? "Stock is below your alert threshold"
                      : data.status === "underwater"
                        ? "Members hold more than provider stock"
                        : "Provider stock could not be read"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {statusCopy(data.status)}
                  {data.cover != null && data.cover < 0 ? (
                    <span className="font-semibold text-destructive">
                      {" "}
                      {formatCredits(Math.abs(data.cover))} credits short.
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Cover
              </p>
              <p
                className={cn(
                  "text-lg font-bold tabular-nums tracking-tight",
                  data.cover != null && data.cover < 0 && "text-destructive",
                  data.status === "ok" && "text-emerald-700 dark:text-emerald-300",
                )}
              >
                {coverLabel}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-primary/20 bg-primary/[0.04]">
              <div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                    <Users className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Sold to accounts</p>
                    <p className="text-[11px] text-muted-foreground">
                      Members · resellers · enterprise
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 px-4 py-3.5">
                <p className="text-2xl font-bold tabular-nums tracking-tight text-primary">
                  {formatCredits(data.memberCredits)}
                </p>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${memberPct}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {Math.round(memberPct)}% of the larger side in this comparison
                </p>
              </div>
            </div>

            <div
              className={cn(
                "overflow-hidden rounded-xl border",
                alertable
                  ? "border-destructive/25 bg-destructive/[0.04]"
                  : "border-emerald-500/25 bg-emerald-500/[0.04]",
              )}
            >
              <div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg ring-1",
                      alertable
                        ? "bg-destructive/12 text-destructive ring-destructive/20"
                        : "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
                    )}
                  >
                    <Radio className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">mNotify stock</p>
                    <p className="text-[11px] text-muted-foreground">Upstream SMS credits</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 px-4 py-3.5">
                <p
                  className={cn(
                    "text-2xl font-bold tabular-nums tracking-tight",
                    alertable && "text-destructive",
                    !alertable && data.providerCredits != null && "text-emerald-700 dark:text-emerald-300",
                  )}
                >
                  {data.providerCredits == null ? "—" : formatCredits(data.providerCredits)}
                </p>
                <div
                  className={cn(
                    "h-2 overflow-hidden rounded-full bg-muted",
                    data.status === "underwater" && "bg-destructive/15",
                  )}
                >
                  <div
                    className={cn(
                      "h-full rounded-full",
                      alertable ? "bg-destructive" : "bg-emerald-600",
                    )}
                    style={{ width: `${providerPct}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {data.providerCredits == null
                    ? "Refresh balances to read stock"
                    : `${Math.round(providerPct)}% of the larger side in this comparison`}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            {(
              [
                ["Members", data.buckets.members, Users],
                ["Resellers", data.buckets.resellers, Layers3],
                ["Enterprise", data.buckets.enterprise, Wallet],
              ] as const
            ).map(([label, bucket, Icon]) => {
              const sharePct =
                data.memberCredits > 0
                  ? Math.round((bucket.credits / data.memberCredits) * 1000) / 10
                  : 0;
              return (
                <div
                  key={label}
                  className="rounded-xl border border-border/60 bg-muted/15 px-3.5 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {label}
                      </p>
                    </div>
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {sharePct}%
                    </span>
                  </div>
                  <p className="mt-2 text-xl font-bold tabular-nums tracking-tight">
                    {formatCredits(bucket.credits)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {bucket.accounts.toLocaleString()}{" "}
                    {bucket.accounts === 1 ? "account" : "accounts"}
                  </p>
                  <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{ width: `${Math.min(100, sharePct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AdminCard>

      <AdminCard
        title="Low-balance threshold"
        description="Alert admins when mNotify stock falls below this level."
        actions={
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 gap-1 text-[10px] font-semibold",
              data.status === "low" || data.status === "underwater"
                ? "border-amber-500/40 text-amber-800 dark:text-amber-200"
                : "border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
            )}
          >
            {data.status === "low" || data.status === "underwater"
              ? "Alert armed"
              : "Watching"}
          </Badge>
        }
      >
        <div className="space-y-4">
          <div
            className={cn(
              "flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
              stockBelowThreshold
                ? "border-amber-500/30 bg-amber-500/[0.05]"
                : data.providerCredits == null
                  ? "border-border/60 bg-muted/20"
                  : "border-emerald-500/25 bg-emerald-500/[0.04]",
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
                  stockBelowThreshold
                    ? "bg-amber-500/12 text-amber-800 ring-amber-500/20 dark:text-amber-200"
                    : data.providerCredits == null
                      ? "bg-muted text-muted-foreground ring-border/60"
                      : "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
                )}
              >
                <BellRing className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold">
                  {data.providerCredits == null
                    ? "Stock unavailable"
                    : stockBelowThreshold
                      ? "Stock is below threshold"
                      : data.threshold === 0
                        ? "Threshold is off (0)"
                        : "Stock is above threshold"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {data.providerCredits == null
                    ? "Refresh balances to compare stock against this alert level."
                    : stockBelowThreshold
                      ? `${formatCredits(Math.abs(thresholdHeadroom ?? 0))} credits under the alert line.`
                      : data.threshold === 0
                        ? "Set a value above 0 to start low-balance alerts."
                        : `${formatCredits(thresholdHeadroom ?? 0)} credits of headroom before alerts fire.`}
                </p>
              </div>
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Current stock
              </p>
              <p
                className={cn(
                  "text-lg font-bold tabular-nums tracking-tight",
                  stockBelowThreshold && "text-amber-800 dark:text-amber-200",
                  !stockBelowThreshold &&
                    data.providerCredits != null &&
                    "text-emerald-700 dark:text-emerald-300",
                )}
              >
                {data.providerCredits == null
                  ? "—"
                  : formatCredits(data.providerCredits)}
              </p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr]">
            <form
              action={saveCreditCoverThresholdAction}
              className="overflow-hidden rounded-xl border border-border/60 bg-muted/10"
            >
              <div className="border-b border-border/50 px-4 py-3">
                <p className="text-sm font-semibold">Alert when stock falls below</p>
                <p className="text-[11px] text-muted-foreground">
                  Saved value is compared against mNotify SMS credits.
                </p>
              </div>
              <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <label
                    htmlFor="credit-cover-threshold"
                    className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Threshold
                  </label>
                  <div className="relative">
                    <Input
                      id="credit-cover-threshold"
                      name="credits"
                      type="number"
                      min={0}
                      step={1}
                      required
                      aria-label="Low-balance threshold in credits"
                      defaultValue={data.threshold}
                      className="h-11 pr-16 text-lg font-semibold tabular-nums"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                      credits
                    </span>
                  </div>
                </div>
                <SaveCreditCoverThresholdButton />
              </div>
            </form>

            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-xl border border-border/60 bg-muted/15 px-3.5 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Threshold
                </p>
                <p className="mt-1.5 text-xl font-bold tabular-nums tracking-tight">
                  {formatCredits(data.threshold)}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Credits that trigger the alert
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/15 px-3.5 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Headroom
                </p>
                <p
                  className={cn(
                    "mt-1.5 text-xl font-bold tabular-nums tracking-tight",
                    stockBelowThreshold && "text-amber-800 dark:text-amber-200",
                  )}
                >
                  {thresholdHeadroom == null
                    ? "—"
                    : stockBelowThreshold
                      ? `−${formatCredits(Math.abs(thresholdHeadroom))}`
                      : formatCredits(thresholdHeadroom)}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Stock minus threshold
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
            {alertable ? (
              <form action={sendCreditCoverAlertAction}>
                <SendCreditCoverAlertButton />
              </form>
            ) : null}
            <Link
              href="/admin/general?tab=alerts"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-9 gap-1.5",
              )}
            >
              <Mail className="h-3.5 w-3.5" />
              Alert contacts
            </Link>
            <p className="text-[11px] text-muted-foreground sm:ml-auto">
              Email, Slack, and SMS to office alert contacts.
            </p>
          </div>
        </div>
      </AdminCard>

      <AdminCard
        title="Other provider wallets"
        description="Twilio and Infobip are prepaid currency, not SMS credits — shown here so you can see overall SMS balance."
        actions={
          <div className="flex flex-wrap gap-2">
            <form action={refreshProviderBalancesAction}>
              <input type="hidden" name="returnTo" value="/admin/credit-cover" />
              <button
                type="submit"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh balances
              </button>
            </form>
            <Link
              href="/admin/providers"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
            >
              <Layers3 className="h-3.5 w-3.5" />
              Providers
            </Link>
            <Link
              href="/admin/balances"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
            >
              <History className="h-3.5 w-3.5" />
              History
            </Link>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {data.balances.map((balance) => {
            const Icon = balance.type === "MNOTIFY" ? Radio : balance.type === "TWILIO" ? Cloud : Globe;
            return (
              <div key={balance.type} className="rounded-xl border border-border/60 bg-muted/15 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{balance.name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{balance.type}</p>
                  </div>
                </div>
                <p className="mt-3 text-lg font-bold tabular-nums">{balance.display}</p>
                <p className="text-xs text-muted-foreground">
                  {balance.type === "MNOTIFY" ? "SMS credits" : "Prepaid wallet"}
                </p>
              </div>
            );
          })}
        </div>
      </AdminCard>

      <AdminCard
        title="Largest credit holders"
        description={
          data.topHolders.length === 0
            ? "Accounts with the most SMS credits"
            : `Top ${data.topHolders.length} by SMS credits`
        }
        actions={
          <Link
            href="/admin/members"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            All members
          </Link>
        }
      >
        {data.topHolders.length === 0 ? (
          <AdminEmpty>No credit balances yet.</AdminEmpty>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/15 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                  <Trophy className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">
                    {formatCredits(topHoldersTotal)} credits in this list
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {topHoldersShareOfSold != null
                      ? `${topHoldersShareOfSold}% of all sold credits · ranked vs the top holder`
                      : "Ranked by wallet balance"}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground sm:shrink-0">
                Leader holds{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {formatCredits(topHoldersLeader)}
                </span>
              </p>
            </div>

            <ul className="space-y-2">
              {data.topHolders.map((row, index) => {
                const rank = index + 1;
                const barPct = Math.min(100, (row.credits / topHoldersLeader) * 100);
                const shareOfSold =
                  data.memberCredits > 0
                    ? Math.round((row.credits / data.memberCredits) * 1000) / 10
                    : null;

                return (
                  <li key={row.userId}>
                    <Link
                      href={holderHref(row.role, row.userId)}
                      className={cn(
                        "group flex flex-col gap-3 rounded-xl border px-3.5 py-3 transition-colors hover:border-primary/30 hover:bg-muted/25 sm:flex-row sm:items-center",
                        rank === 1
                          ? "border-amber-500/25 bg-amber-500/[0.04]"
                          : "border-border/60 bg-card",
                      )}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <RankMark rank={rank} />
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-[11px] font-semibold tracking-wide text-muted-foreground ring-1 ring-border/60">
                          {initials(row.fullName)}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="truncate text-sm font-semibold group-hover:underline">
                              {row.fullName}
                            </p>
                            <Badge
                              variant="outline"
                              className="text-[10px] font-semibold text-muted-foreground"
                            >
                              {roleLabel(row.role)}
                            </Badge>
                          </div>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            {row.phone}
                          </p>
                        </div>
                      </div>

                      <div className="flex w-full items-center gap-3 sm:w-[min(100%,18rem)] sm:shrink-0">
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                            <span>Share of leader</span>
                            <span className="tabular-nums font-medium">
                              {Math.round(barPct)}%
                              {shareOfSold != null ? ` · ${shareOfSold}% sold` : ""}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                rank === 1 ? "bg-amber-500/80" : "bg-primary/80",
                              )}
                              style={{ width: `${barPct}%` }}
                            />
                          </div>
                        </div>
                        <p className="w-[4.5rem] shrink-0 text-right text-base font-bold tabular-nums tracking-tight">
                          {formatCredits(row.credits)}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
