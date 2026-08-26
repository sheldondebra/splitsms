import Link from "next/link";
import {
  AdminAlert,
  AdminCard,
  AdminEmpty,
  AdminStatCard,
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
  Cloud,
  Globe,
  History,
  Layers3,
  Mail,
  MessageSquare,
  Radio,
  RefreshCw,
  Scale,
  Users,
  Wallet,
} from "lucide-react";

function formatCredits(n: number) {
  return n.toLocaleString();
}

function holderHref(role: string, userId: string) {
  if (role === "RESELLER") return `/admin/resellers/${userId}`;
  if (role === "ENTERPRISE") return `/admin/enterprise`;
  return `/admin/members/${userId}`;
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

function CoverMeter({
  label,
  value,
  pct,
  barClass,
  trackClass,
}: {
  label: string;
  value: string;
  pct: number;
  barClass: string;
  trackClass?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-semibold tabular-nums">{value}</span>
      </div>
      <div className={cn("h-2 overflow-hidden rounded-full bg-muted", trackClass)}>
        <div
          className={cn("h-full rounded-full", barClass)}
          style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        />
      </div>
    </div>
  );
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
  const scale = Math.max(data.memberCredits, data.providerCredits ?? 0, 1);
  const memberPct = Math.min(100, (data.memberCredits / scale) * 100);
  const providerPct =
    data.providerCredits == null ? 0 : Math.min(100, (data.providerCredits / scale) * 100);

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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Member SMS credits"
          value={formatCredits(data.memberCredits)}
          hint="Credits held by members, resellers, and enterprise"
          icon={Users}
          variant="primary"
        />
        <AdminStatCard
          label="Provider SMS stock"
          value={data.providerCredits == null ? "—" : formatCredits(data.providerCredits)}
          hint={data.mnotify?.display ?? "mNotify main balance"}
          icon={MessageSquare}
          variant={data.status === "unknown" ? "warning" : "default"}
          href="/admin/providers"
        />
        <AdminStatCard
          label="Cover"
          value={coverLabel}
          hint="Provider stock minus member credits"
          icon={Scale}
          variant={
            data.status === "underwater"
              ? "danger"
              : data.status === "low"
                ? "warning"
                : "default"
          }
        />
        <AdminStatCard
          label="Alert threshold"
          value={formatCredits(data.threshold)}
          hint="Warn when provider stock falls below this"
          icon={Wallet}
        />
      </div>

      <AdminCard
        title="Member credits vs provider stock"
        actions={
          <Badge
            variant={alertable ? "destructive" : "secondary"}
            className={cn(
              "shrink-0",
              data.status === "ok" && "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
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
        <div className="space-y-5">
          {data.status !== "ok" && (
            <p
              className={cn(
                "rounded-lg border px-3 py-2 text-sm",
                data.status === "unknown"
                  ? "border-amber-500/30 bg-amber-500/8 text-amber-800 dark:text-amber-200"
                  : "border-destructive/25 bg-destructive/5 text-destructive",
              )}
            >
              {statusCopy(data.status)}
              {data.cover != null && data.cover < 0 ? (
                <span className="font-semibold"> {formatCredits(Math.abs(data.cover))} credits short.</span>
              ) : null}
            </p>
          )}

          <div className="space-y-4">
            <CoverMeter
              label="Sold to accounts"
              value={formatCredits(data.memberCredits)}
              pct={memberPct}
              barClass="bg-primary"
            />
            <CoverMeter
              label="mNotify stock"
              value={data.providerCredits == null ? "—" : formatCredits(data.providerCredits)}
              pct={providerPct}
              barClass={alertable ? "bg-red-600" : "bg-emerald-600"}
              trackClass={data.status === "underwater" ? "bg-red-600/15" : undefined}
            />
          </div>

          <div className="grid grid-cols-1 divide-y divide-border/60 rounded-lg border border-border/60 bg-muted/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {(
              [
                ["Members", data.buckets.members],
                ["Resellers", data.buckets.resellers],
                ["Enterprise", data.buckets.enterprise],
              ] as const
            ).map(([label, bucket]) => (
              <div key={label} className="px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1 text-base font-bold tabular-nums">
                  {formatCredits(bucket.credits)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {bucket.accounts.toLocaleString()} account{bucket.accounts === 1 ? "" : "s"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </AdminCard>

      <div className="rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Low-balance threshold</p>
            <p className="text-xs text-muted-foreground">
              Alert admins when mNotify stock falls below this.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <form action={saveCreditCoverThresholdAction} className="flex items-center gap-2">
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
                  className="h-9 w-36 pr-16 text-right tabular-nums"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                  credits
                </span>
              </div>
              <SaveCreditCoverThresholdButton />
            </form>

            {alertable ? (
              <form action={sendCreditCoverAlertAction}>
                <SendCreditCoverAlertButton />
              </form>
            ) : null}

            <Link
              href="/admin/general?tab=alerts"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9 gap-1.5")}
            >
              <Mail className="h-3.5 w-3.5" />
              Contacts
            </Link>
          </div>
        </div>
      </div>

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
          <div className="max-h-[22rem] overflow-auto -mx-5 -mb-5">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card">
                <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="w-10 px-5 py-2 font-semibold">#</th>
                  <th className="px-3 py-2 font-semibold">Account</th>
                  <th className="px-3 py-2 font-semibold">Role</th>
                  <th className="w-32 px-3 py-2 font-semibold">Share</th>
                  <th className="px-5 py-2 text-right font-semibold">Credits</th>
                </tr>
              </thead>
              <tbody>
                {data.topHolders.map((row, index) => {
                  const maxHold = data.topHolders[0]?.credits || 1;
                  const barPct = Math.min(100, (row.credits / maxHold) * 100);
                  return (
                    <tr
                      key={row.userId}
                      className="border-b border-border/40 last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-5 py-2 text-xs tabular-nums text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="px-3 py-2 min-w-0">
                        <Link
                          href={holderHref(row.role, row.userId)}
                          className="font-medium hover:underline truncate block"
                        >
                          {row.fullName}
                        </Link>
                        <p className="font-mono text-[11px] text-muted-foreground">{row.phone}</p>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                        {row.role === "MEMBER"
                          ? "Member"
                          : row.role === "RESELLER"
                            ? "Reseller"
                            : "Enterprise"}
                      </td>
                      <td className="px-3 py-2">
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary/80"
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-2 text-right font-semibold tabular-nums whitespace-nowrap">
                        {formatCredits(row.credits)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
