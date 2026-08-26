import Link from "next/link";
import { format } from "date-fns";
import {
  AdminPage,
  AdminPageHeader,
  AdminCard,
  AdminStatCard,
  AdminEmpty,
  AdminAlert,
} from "@/components/admin/admin-page-shell";
import {
  ReportPeriodTabs,
  ReportSubnav,
  ADMIN_REPORT_NAV,
} from "@/components/reports/report-nav";
import {
  CountryBarChart,
  DailySmsChart,
  DeliveryPieChart,
  ReasonBarChart,
  SimpleLineChart,
  SpendingChart,
} from "@/components/dashboard/charts";
import type {
  getAdminDeliveryReport,
  getAdminLoginsReport,
  getAdminMembersReport,
  getAdminReportsOverview,
  getAdminTransactionsReport,
} from "@/lib/reports/admin-reports";
import type { ReportPeriodDays, ReportSnapshotKind, ReportSnapshotWindow } from "@/lib/reports/period";
import { reportSnapshotDetailHref } from "@/lib/reports/period";
import { adminSendDeliveryFailureNoticeAction, adminRetryMemberDeliveryFailuresAction } from "@/lib/actions/admin-reports";
import { getTransactionMeta, formatTxAmount } from "@/lib/billing/transaction-meta";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eye, FileBarChart2, Mail, RefreshCw } from "lucide-react";

const BASE = "/admin/reports";

const SNAPSHOT_WINDOWS: { window: ReportSnapshotWindow; label: string; hint: string }[] = [
  { window: "daily", label: "Daily", hint: "Today" },
  { window: "weekly", label: "Weekly", hint: "Last 7 days" },
  { window: "monthly", label: "Monthly", hint: "Last 30 days" },
];

function formatGhs(amount: number) {
  return `GHS ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function SnapshotStatRow({
  title,
  kind,
  values,
  amountByWindow,
}: {
  title: string;
  kind: ReportSnapshotKind;
  values: { daily: number; weekly: number; monthly: number };
  amountByWindow?: { daily: number; weekly: number; monthly: number };
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        {title}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {SNAPSHOT_WINDOWS.map((item) => {
          const amount = amountByWindow?.[item.window];
          return (
            <AdminStatCard
              key={item.window}
              label={`${item.label} ${title}`}
              value={values[item.window].toLocaleString()}
              hint={amount != null ? `${item.hint} · ${formatGhs(amount)}` : item.hint}
              href={reportSnapshotDetailHref(kind, item.window)}
            />
          );
        })}
      </div>
    </div>
  );
}

function Shell({
  title,
  description,
  period,
  current,
  children,
}: {
  title: string;
  description: string;
  period: ReportPeriodDays;
  current: string;
  children: React.ReactNode;
}) {
  return (
    <AdminPage wide>
      <AdminPageHeader
        title={title}
        description={description}
        icon={FileBarChart2}
        actions={<ReportPeriodTabs basePath={current} period={period} />}
      />
      <ReportSubnav base={BASE} current={current} items={[...ADMIN_REPORT_NAV]} />
      {children}
    </AdminPage>
  );
}

export function AdminReportsOverviewView({
  data,
}: {
  data: Awaited<ReturnType<typeof getAdminReportsOverview>>;
}) {
  return (
    <Shell
      title="Reports overview"
      description="Platform-wide delivery, revenue, members, and login activity."
      period={data.periodDays}
      current={BASE}
    >
      <div className="space-y-5">
        <SnapshotStatRow
          title="SMS sent"
          kind="delivery"
          values={data.snapshots.sms}
        />
        <SnapshotStatRow
          title="Signups"
          kind="members"
          values={data.snapshots.signups}
        />
        <SnapshotStatRow
          title="Transactions"
          kind="transactions"
          values={{
            daily: data.snapshots.transactions.daily.count,
            weekly: data.snapshots.transactions.weekly.count,
            monthly: data.snapshots.transactions.monthly.count,
          }}
          amountByWindow={{
            daily: data.snapshots.transactions.daily.amount,
            weekly: data.snapshots.transactions.weekly.amount,
            monthly: data.snapshots.transactions.monthly.amount,
          }}
        />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Selected period
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatCard label="Messages" value={data.kpis.messages.toLocaleString()} href={`${BASE}/delivery?days=${data.periodDays}`} />
          <AdminStatCard label="Delivered" value={data.kpis.delivered.toLocaleString()} href={`${BASE}/delivery?days=${data.periodDays}`} />
          <AdminStatCard label="Failed" value={data.kpis.failed.toLocaleString()} href={`${BASE}/delivery?days=${data.periodDays}`} />
          <AdminStatCard label="New members" value={data.kpis.newMembers.toLocaleString()} href={`${BASE}/members?days=${data.periodDays}`} />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard title="SMS volume (area)" description="Messages created per day">
          <DailySmsChart data={data.charts.smsVolume} />
        </AdminCard>
        <AdminCard title="Wallet / credit inflows (bar)" description="Top-ups & credit purchases">
          <SpendingChart data={data.charts.revenueArea} />
        </AdminCard>
        <AdminCard title="Delivery mix" description="Status breakdown">
          <DeliveryPieChart data={data.charts.deliveryChart} showDetails />
        </AdminCard>
        <AdminCard title="Auth activity (line)" description="Login-related audit events">
          <SimpleLineChart data={data.charts.loginVolume} />
        </AdminCard>
      </div>
    </Shell>
  );
}

export function AdminDeliveryReportView({
  data,
  flash,
}: {
  data: Awaited<ReturnType<typeof getAdminDeliveryReport>>;
  flash?: {
    saved?: string;
    error?: string;
    detail?: string;
    member?: string;
    retried?: string;
  };
}) {
  const returnTo = `${BASE}/delivery?days=${data.periodDays}`;

  return (
    <Shell
      title="Delivery report"
      description="Sent vs failed SMS with failure reasons, countries, and providers."
      period={data.periodDays}
      current={`${BASE}/delivery`}
    >
      {flash?.saved === "failure_notice" && (
        <AdminAlert variant="success">
          Failure notice emailed
          {flash.member ? ` to ${flash.member}` : " to the member"}. They also got an in-app
          notification.
        </AdminAlert>
      )}
      {flash?.retried != null && flash.retried !== "" && (
        <AdminAlert variant="info">
          Re-queued {flash.retried} failed message{Number(flash.retried) === 1 ? "" : "s"}
          {flash.member ? ` for ${flash.member}` : ""}
          {Number(flash.retried) > 0
            ? " — member notified by email. Process pending queue if needed."
            : "."}
        </AdminAlert>
      )}
      {flash?.error === "credits" && (
        <AdminAlert variant="destructive">
          Retry blocked
          {flash.member ? ` for ${flash.member}` : ""} — not enough SMS credits. Member was
          notified to top up.
        </AdminAlert>
      )}
      {flash?.error === "no_email" && (
        <AdminAlert variant="destructive">
          Cannot email{flash.member ? ` ${flash.member}` : " this member"} — no email on file.
        </AdminAlert>
      )}
      {flash?.error === "email" && (
        <AdminAlert variant="destructive">
          Could not send email{flash.detail ? `: ${flash.detail}` : "."}
        </AdminAlert>
      )}
      {flash?.error === "failure_notice" && (
        <AdminAlert variant="destructive">Could not send failure notice — missing member or reason.</AdminAlert>
      )}
      {flash?.error === "retry" && (
        <AdminAlert variant="destructive">Could not retry — member missing.</AdminAlert>
      )}

      <SnapshotStatRow title="SMS sent" kind="delivery" values={data.snapshots} />
      <div className="grid gap-3 sm:grid-cols-3">
        <AdminStatCard label="Total" value={data.totals.total.toLocaleString()} />
        <AdminStatCard label="Delivered" value={data.totals.delivered.toLocaleString()} />
        <AdminStatCard label="Failed" value={data.totals.failed.toLocaleString()} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard title="Volume over time">
          <DailySmsChart data={data.volume} />
        </AdminCard>
        <AdminCard title="Status mix">
          <DeliveryPieChart data={data.statusChart} showDetails />
        </AdminCard>
        <AdminCard title="By country">
          <CountryBarChart data={data.countryChart} />
        </AdminCard>
        <AdminCard title="Failure reasons" description="Why SMS failed">
          <ReasonBarChart data={data.failureReasons} />
        </AdminCard>
      </div>
      <AdminCard
        title="Failed SMS by member"
        description="Member details, failure count, reason — email them the notice"
      >
        {data.memberFailures.length === 0 ? (
          <AdminEmpty>No failures in this period.</AdminEmpty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Member</th>
                  <th className="px-3 py-2 font-medium">Phone</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium text-right">Failed SMS</th>
                  <th className="px-3 py-2 font-medium whitespace-nowrap">Date & time</th>
                  <th className="px-3 py-2 font-medium min-w-[200px]">Reason</th>
                  <th className="px-3 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.memberFailures.map((r) => (
                  <tr
                    key={`${r.memberId}-${r.reason}`}
                    className="border-b border-border/40 align-top"
                  >
                    <td className="px-3 py-3">
                      <Link
                        href={`/admin/members/${r.memberId}?tab=messaging`}
                        className="font-medium text-primary hover:underline"
                      >
                        {r.memberName}
                      </Link>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs whitespace-nowrap">
                      {r.memberPhone}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground max-w-[180px] truncate">
                      {r.memberEmail ?? (
                        <span className="text-amber-700 dark:text-amber-300">No email</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums font-semibold">
                      {r.failedCount.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      <p className="tabular-nums font-medium text-foreground">
                        {format(r.lastFailedAt, "MMM d, yyyy · HH:mm")}
                      </p>
                      {r.failedCount > 1 &&
                      r.firstFailedAt.getTime() !== r.lastFailedAt.getTime() ? (
                        <p className="mt-0.5 tabular-nums">
                          First: {format(r.firstFailedAt, "MMM d, HH:mm")}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground leading-relaxed">
                      {r.reason}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/messages?userId=${r.memberId}&status=FAILED`}
                          title="View failed messages in SMS logs"
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Link>
                        <form action={adminRetryMemberDeliveryFailuresAction}>
                          <input type="hidden" name="userId" value={r.memberId} />
                          <input type="hidden" name="reason" value={r.reason} />
                          <input type="hidden" name="days" value={data.periodDays} />
                          <input type="hidden" name="returnTo" value={returnTo} />
                          <Button
                            type="submit"
                            size="sm"
                            variant="secondary"
                            className="h-8 gap-1.5"
                            title={`Retry ${r.failedCount} failed SMS`}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Retry
                          </Button>
                        </form>
                        <form action={adminSendDeliveryFailureNoticeAction}>
                          <input type="hidden" name="userId" value={r.memberId} />
                          <input type="hidden" name="reason" value={r.reason} />
                          <input type="hidden" name="failedCount" value={r.failedCount} />
                          <input
                            type="hidden"
                            name="lastFailedAt"
                            value={r.lastFailedAt.toISOString()}
                          />
                          <input type="hidden" name="days" value={data.periodDays} />
                          <input type="hidden" name="returnTo" value={returnTo} />
                          <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5"
                            disabled={!r.memberEmail}
                            title={
                              r.memberEmail
                                ? "Email member the failure reason"
                                : "No email on file"
                            }
                          >
                            <Mail className="h-3.5 w-3.5" />
                            Email
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </Shell>
  );
}

export function AdminTransactionsReportView({
  data,
}: {
  data: Awaited<ReturnType<typeof getAdminTransactionsReport>>;
}) {
  return (
    <Shell
      title="Transactions report"
      description="Wallet top-ups, credit purchases, SMS debits, and admin adjustments."
      period={data.periodDays}
      current={`${BASE}/transactions`}
    >
      <SnapshotStatRow
        title="Transactions"
        kind="transactions"
        values={{
          daily: data.snapshots.daily.count,
          weekly: data.snapshots.weekly.count,
          monthly: data.snapshots.monthly.count,
        }}
        amountByWindow={{
          daily: data.snapshots.daily.amount,
          weekly: data.snapshots.weekly.amount,
          monthly: data.snapshots.monthly.amount,
        }}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard title="Transaction volume (line)">
          <SimpleLineChart data={data.volume} />
        </AdminCard>
        <AdminCard title="By type" description="Completed transactions in this period">
          {data.byType.length === 0 ? (
            <AdminEmpty>No transactions.</AdminEmpty>
          ) : (
            <ul className="divide-y divide-border/40">
              {[...data.byType]
                .sort((a, b) => b.count - a.count)
                .map((t) => {
                  const meta = getTransactionMeta(t.type);
                  const Icon = meta.icon;
                  return (
                    <li key={t.type} className="flex items-center gap-3 py-2.5">
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                          meta.credit
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-tight">{meta.label}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                          {t.count.toLocaleString()} transaction{t.count === 1 ? "" : "s"}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular-nums tracking-tight">
                        {formatGhs(t.amount)}
                      </p>
                    </li>
                  );
                })}
            </ul>
          )}
        </AdminCard>
      </div>
      <AdminCard
        title="Recent transactions"
        description={
          data.rows.length === 0
            ? "Latest activity in this period"
            : `Latest ${data.rows.length} in this period`
        }
      >
        {data.rows.length === 0 ? (
          <AdminEmpty>No transactions in this period.</AdminEmpty>
        ) : (
          <div className="max-h-[28rem] overflow-auto -mx-5 -mb-5">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card">
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-5 py-2.5 font-medium">When</th>
                  <th className="px-5 py-2.5 font-medium">Member</th>
                  <th className="px-5 py-2.5 font-medium">Type</th>
                  <th className="px-5 py-2.5 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => {
                  const meta = getTransactionMeta(r.type);
                  const Icon = meta.icon;
                  return (
                    <tr key={r.id} className="border-b border-border/40 last:border-0">
                      <td className="px-5 py-3 whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                        {format(r.createdAt, "MMM d, h:mm a")}
                      </td>
                      <td className="px-5 py-3 min-w-0">
                        <Link
                          href={`/admin/members/${r.memberId}?tab=billing`}
                          className="block font-medium text-primary hover:underline truncate"
                        >
                          {r.memberName}
                        </Link>
                        {r.memberPhone ? (
                          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground truncate">
                            {r.memberPhone}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                              meta.credit
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-medium truncate">{meta.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <p
                          className={cn(
                            "font-semibold tabular-nums tracking-tight",
                            meta.credit
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-foreground",
                          )}
                        >
                          {formatTxAmount(r.amount, r.currency, meta.credit)}
                        </p>
                        {r.credits != null ? (
                          <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                            {r.credits.toLocaleString()} credit{r.credits === 1 ? "" : "s"}
                          </p>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </Shell>
  );
}

export function AdminLoginsReportView({
  data,
}: {
  data: Awaited<ReturnType<typeof getAdminLoginsReport>>;
}) {
  return (
    <Shell
      title="Logins report"
      description="Authentication events — successes, failures, OTP, and lockouts."
      period={data.periodDays}
      current={`${BASE}/logins`}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard title="Auth events over time">
          <SimpleLineChart data={data.volume} />
        </AdminCard>
        <AdminCard title="By action">
          <ul className="divide-y divide-border/40">
            {data.byAction.map((a) => (
              <li key={a.action} className="flex justify-between py-2.5 text-sm">
                <code className="text-xs font-semibold text-primary">{a.action}</code>
                <span className="tabular-nums">{a.count.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </AdminCard>
      </div>
      <AdminCard title="Recent auth events">
        {data.rows.length === 0 ? (
          <AdminEmpty>No auth events in this period.</AdminEmpty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Member</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/40">
                    <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {format(r.createdAt, "MMM d, HH:mm")}
                    </td>
                    <td className="px-3 py-2.5">
                      <code className="text-xs">{r.action}</code>
                    </td>
                    <td className="px-3 py-2.5">
                      {r.actorId ? (
                        <Link
                          href={`/admin/members/${r.actorId}`}
                          className="text-primary hover:underline"
                        >
                          {r.memberName ?? r.memberPhone ?? r.actorId}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </Shell>
  );
}

export function AdminMembersReportView({
  data,
}: {
  data: Awaited<ReturnType<typeof getAdminMembersReport>>;
}) {
  return (
    <Shell
      title="Members report"
      description="Signups, verification, suspensions, and credit balances."
      period={data.periodDays}
      current={`${BASE}/members`}
    >
      <SnapshotStatRow title="Signups" kind="members" values={data.snapshots} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <AdminStatCard label="Total members" value={data.kpis.total.toLocaleString()} />
        <AdminStatCard label="Verified" value={data.kpis.verified.toLocaleString()} />
        <AdminStatCard label="Suspended" value={data.kpis.suspended.toLocaleString()} />
        <AdminStatCard label="New (period)" value={data.kpis.newInPeriod.toLocaleString()} />
        <AdminStatCard label="Low credits ≤10" value={data.kpis.lowCredits.toLocaleString()} />
      </div>
      <AdminCard title="Signups (line)">
        <SimpleLineChart data={data.signupVolume} />
      </AdminCard>
      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard title="Recent signups">
          {data.recent.length === 0 ? (
            <AdminEmpty>No new members.</AdminEmpty>
          ) : (
            <ul className="divide-y divide-border/40 max-h-96 overflow-y-auto">
              {data.recent.map((m) => (
                <li key={m.id} className="flex justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/members/${m.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {m.fullName}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">{m.phone}</p>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                    {format(m.createdAt, "MMM d")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
        <AdminCard title="Highest SMS credit balances">
          <ul className="divide-y divide-border/40">
            {data.topCredits.map((c) => (
              <li key={c.userId} className="flex justify-between py-2.5 text-sm">
                <Link
                  href={`/admin/members/${c.userId}?tab=billing`}
                  className="text-primary hover:underline"
                >
                  {c.fullName}
                </Link>
                <span className="tabular-nums font-semibold">{c.balance.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </AdminCard>
      </div>
    </Shell>
  );
}
