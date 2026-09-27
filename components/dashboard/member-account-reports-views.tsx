import Link from "next/link";
import { format } from "date-fns";
import {
  AppPage,
  PageHeader,
  AppCard,
  AppCardBody,
  AppCardTitle,
} from "@/components/dashboard/page-shell";
import {
  ReportPeriodTabs,
  ReportSubnav,
  MEMBER_REPORT_NAV,
} from "@/components/reports/report-nav";
import {
  CountryBarChart,
  DailySmsChart,
  DeliveryPieChart,
  ReasonBarChart,
  SimpleLineChart,
} from "@/components/dashboard/charts";
import type { MemberAccountReport } from "@/lib/reports/member-account-report";
import type { ReportPeriodDays } from "@/lib/reports/period";
import {
  formatAuthEvent,
  formatDeliveryRate,
  formatReportCount,
  formatReportDate,
  formatReportDateTime,
  formatReportMoney,
  formatReportToken,
  loginMetaSummary,
} from "@/lib/reports/format";
import { getTransactionMeta, formatTxAmount } from "@/lib/billing/transaction-meta";
import { getMessageStatusMeta } from "@/lib/reports/message-meta";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { countByDay, dayLabels, daysAgo } from "@/lib/reports/period";
import {
  ArrowLeftRight,
  BarChart3,
  CheckCircle2,
  Coins,
  Download,
  FileBarChart2,
  Hash,
  Mail,
  Megaphone,
  MessageSquare,
  Phone,
  Send,
  ShieldAlert,
  ShieldCheck,
  Wallet,
} from "lucide-react";

const BASE = "/dashboard/account-reports";

function periodLabel(days: ReportPeriodDays) {
  return `Last ${days} days`;
}

function pdfHref(period: ReportPeriodDays) {
  return `/api/dashboard/account-reports/pdf?days=${period}&download=1`;
}

function EmptyNote({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: { label: string; href: string };
}) {
  return (
    <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center">
      <p className="text-sm text-muted-foreground">{children}</p>
      {action ? (
        <Link
          href={action.href}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "mt-4 h-9 rounded-xl",
          )}
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "primary" | "ok" | "bad";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 px-3.5 py-3",
        tone === "primary" && "border-primary/20 bg-primary/[0.04]",
        tone === "ok" && "border-emerald-500/20 bg-emerald-500/[0.04]",
        tone === "bad" && "border-destructive/20 bg-destructive/[0.04]",
        tone === "neutral" && "bg-muted/15",
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-xl font-bold tabular-nums tracking-tight sm:text-2xl",
          tone === "primary" && "text-primary",
          tone === "ok" && "text-emerald-700 dark:text-emerald-300",
          tone === "bad" && "text-destructive",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  description?: string;
  icon?: typeof FileBarChart2;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border/50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-start gap-3">
          {Icon ? (
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
              <Icon className="h-4 w-4" />
            </span>
          ) : null}
          <div>
            <p className="text-sm font-semibold">{title}</p>
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        {action}
      </div>
      <div className="px-4 py-4 sm:px-5 sm:py-5">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] items-start gap-3 border-b border-border/40 py-2.5 last:border-0 sm:grid-cols-[9rem_1fr]">
      <dt className="pt-0.5 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-medium">{value || "Not set"}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const meta = getMessageStatusMeta(status);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold",
        meta.badgeClass,
      )}
    >
      {meta.label}
    </span>
  );
}

function SenderPills({
  items,
}: {
  items: MemberAccountReport["senderIdDetails"];
}) {
  if (items.length === 0) {
    return <span className="font-normal text-muted-foreground">None registered</span>;
  }
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item.value}
          className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background px-2 py-0.5 font-mono text-[11px]"
        >
          {item.value}
          <span className="font-sans text-muted-foreground">
            {formatReportToken(item.status)}
            {item.isDefault ? ", default" : ""}
          </span>
        </span>
      ))}
    </span>
  );
}

function ReportTable({
  columns,
  children,
}: {
  columns: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border/60 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {columns.map((col) => (
              <th key={col} className="whitespace-nowrap px-2 py-2.5 font-semibold">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
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
    <AppPage wide>
      <PageHeader
        title={title}
        description={description}
        icon={FileBarChart2}
        mobileDescription="Account statement, delivery, billing, and logins."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ReportPeriodTabs basePath={current} period={period} />
            <a
              href={pdfHref(period)}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-9 gap-1.5 rounded-xl",
              )}
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </a>
          </div>
        }
      />
      <div className="mb-5">
        <ReportSubnav base={BASE} current={current} items={[...MEMBER_REPORT_NAV]} />
      </div>
      {children}
    </AppPage>
  );
}

function periodInsight(report: MemberAccountReport) {
  const { kpis } = report;
  const rate = kpis.messages > 0 ? (kpis.delivered / kpis.messages) * 100 : 0;
  if (kpis.messages === 0) {
    if (kpis.allTimeMessages > 0 && kpis.lastMessageAt) {
      return {
        title: "Quiet period",
        text: `No SMS in the last ${report.periodDays} days. Your last send was ${formatReportDate(kpis.lastMessageAt)} (${formatReportCount(kpis.allTimeMessages)} all-time).`,
        tone: "neutral" as const,
      };
    }
    return {
      title: "No traffic yet",
      text: "Send your first SMS to start building this account statement.",
      tone: "primary" as const,
    };
  }
  if (kpis.failed > 0 && rate < 70) {
    return {
      title: "Delivery needs attention",
      text: `${formatReportCount(kpis.failed)} failed of ${formatReportCount(kpis.messages)} · ${rate.toFixed(1)}% delivered. Review failure reasons below.`,
      tone: "bad" as const,
    };
  }
  if (rate >= 90) {
    return {
      title: "Strong delivery",
      text: `${rate.toFixed(1)}% delivered across ${formatReportCount(kpis.messages)} messages · ${formatReportCount(kpis.smsUnits)} SMS units used.`,
      tone: "ok" as const,
    };
  }
  return {
    title: "Period snapshot",
    text: `${formatReportCount(kpis.messages)} messages · ${rate.toFixed(1)}% delivered · ${formatReportCount(kpis.smsUnits)} units · avg ${kpis.avgUnitsPerMessage} units/message.`,
    tone: "neutral" as const,
  };
}

export function MemberAccountReportsOverview({
  report,
}: {
  report: MemberAccountReport;
}) {
  const { member, kpis } = report;
  const deliveryRate = formatDeliveryRate(kpis.delivered, kpis.messages);
  const mixTotal = report.charts.deliveryChart.reduce((sum, row) => sum + row.value, 0);
  const insight = periodInsight(report);
  const defaultSender =
    report.senderIdDetails.find((s) => s.isDefault)?.value ??
    report.senderIdDetails[0]?.value ??
    null;
  const lastLogin = report.logins[0] ?? null;

  return (
    <Shell
      title="My reports"
      description={`Account statement for ${periodLabel(report.periodDays).toLowerCase()}, from ${formatReportDate(report.periodFrom)} to ${formatReportDate(report.periodTo)}.`}
      period={report.periodDays}
      current={BASE}
    >
      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border/50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
                  insight.tone === "ok" &&
                    "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
                  insight.tone === "bad" &&
                    "bg-destructive/10 text-destructive ring-destructive/20",
                  insight.tone === "primary" && "bg-primary/10 text-primary ring-primary/15",
                  insight.tone === "neutral" &&
                    "bg-muted text-muted-foreground ring-border/60",
                )}
              >
                {insight.tone === "ok" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <FileBarChart2 className="h-4 w-4" />
                )}
              </span>
              <div>
                <p className="text-sm font-semibold">{insight.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{insight.text}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard/reports"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-9 gap-1.5 rounded-xl",
                )}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Message results
              </Link>
              <Link
                href="/dashboard/send"
                className={cn(buttonVariants({ size: "sm" }), "h-9 gap-1.5 rounded-xl")}
              >
                <Send className="h-3.5 w-3.5" />
                Send SMS
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8">
            {[
              {
                label: "Messages",
                value: formatReportCount(kpis.messages),
                hint: `${formatReportCount(kpis.smsUnits)} units`,
                tone: "primary" as const,
              },
              {
                label: "Delivered",
                value: formatReportCount(kpis.delivered),
                hint: deliveryRate,
                tone: "ok" as const,
              },
              {
                label: "Failed",
                value: formatReportCount(kpis.failed),
                hint: "Need review",
                tone: kpis.failed > 0 ? ("bad" as const) : ("neutral" as const),
              },
              {
                label: "Pending",
                value: formatReportCount(kpis.pending),
                hint: "In transit",
                tone: "neutral" as const,
              },
              {
                label: "Avg units",
                value: String(kpis.avgUnitsPerMessage),
                hint: "Per message",
                tone: "neutral" as const,
              },
              {
                label: "Campaigns",
                value: formatReportCount(kpis.campaigns),
                hint: "This period",
                tone: "neutral" as const,
              },
              {
                label: "Credits",
                value: formatReportCount(member.credits),
                hint: "Balance left",
                tone: "neutral" as const,
              },
              {
                label: "Wallet",
                value: formatReportMoney(member.walletCurrency, member.walletBalance),
                hint: "Available",
                tone: "neutral" as const,
              },
            ].map(({ label, value, hint, tone }, index) => (
              <div
                key={label}
                className={cn(
                  "border-b border-border/50 p-3.5 xl:border-b-0",
                  index % 2 === 0 && "sm:border-r",
                  index < 7 && "xl:border-r",
                  index < 6 && "sm:border-b",
                  tone === "primary" && "bg-primary/[0.03]",
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <p
                  className={cn(
                    "mt-1.5 text-lg font-bold tabular-nums tracking-tight sm:text-xl",
                    tone === "primary" && "text-primary",
                    tone === "ok" && "text-emerald-700 dark:text-emerald-300",
                    tone === "bad" && "text-destructive",
                  )}
                >
                  {value}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              href: `${BASE}/delivery?days=${report.periodDays}`,
              icon: MessageSquare,
              title: "Delivery report",
              text: `${formatReportCount(kpis.messages)} messages · ${deliveryRate}`,
            },
            {
              href: `${BASE}/transactions?days=${report.periodDays}`,
              icon: ArrowLeftRight,
              title: "Transactions",
              text: `${formatReportCount(kpis.transactions)} in this period`,
            },
            {
              href: `${BASE}/logins?days=${report.periodDays}`,
              icon: ShieldCheck,
              title: "Login activity",
              text: `${formatReportCount(kpis.logins)} auth events`,
            },
            {
              href: "/dashboard/wallet",
              icon: Wallet,
              title: "Wallet & credits",
              text: `${formatReportMoney(member.walletCurrency, member.walletBalance)} · ${formatReportCount(member.credits)} SMS`,
            },
          ].map(({ href, icon: Icon, title, text }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3.5 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/20"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{text}</span>
              </span>
            </Link>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="flex flex-col gap-4 border-b border-border/50 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
            <div className="min-w-0">
              <p className="text-lg font-semibold tracking-tight sm:text-xl">{member.fullName}</p>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                  {member.accountId}
                </span>
                {member.phone ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                    {member.phone}
                  </span>
                ) : null}
                {member.email ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                    {member.email}
                  </span>
                ) : null}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={member.isVerified ? "secondary" : "outline"}
                className="h-7 gap-1 rounded-lg"
              >
                {member.isVerified ? (
                  <ShieldCheck className="h-3.5 w-3.5" />
                ) : (
                  <ShieldAlert className="h-3.5 w-3.5" />
                )}
                {member.isVerified ? "Verified" : "Not verified"}
              </Badge>
              <Badge variant="outline" className="h-7 rounded-lg">
                {member.countryName}
              </Badge>
              <Badge variant="outline" className="h-7 rounded-lg">
                Joined {formatReportDate(member.createdAt)}
              </Badge>
            </div>
          </div>
          <dl className="grid gap-x-8 px-4 py-2 sm:grid-cols-2 sm:px-5">
            <DetailRow label="Member ID" value={member.accountId} />
            <DetailRow label="Phone" value={member.phone} />
            <DetailRow label="Email" value={member.email?.trim() || "No email on file"} />
            <DetailRow label="Country" value={member.countryName} />
            <DetailRow label="Account opened" value={formatReportDate(member.createdAt)} />
            <DetailRow
              label="Report window"
              value={`${formatReportDate(report.periodFrom)} → ${formatReportDate(report.periodTo)}`}
            />
            <DetailRow
              label="All-time SMS"
              value={`${formatReportCount(kpis.allTimeMessages)}${
                kpis.lastMessageAt ? ` · last ${formatReportDate(kpis.lastMessageAt)}` : ""
              }`}
            />
            <DetailRow
              label="Default sender"
              value={defaultSender ?? "None registered"}
            />
            <DetailRow
              label="Last login"
              value={
                lastLogin
                  ? `${formatAuthEvent(lastLogin.action)} · ${formatReportDateTime(lastLogin.createdAt)}`
                  : "No auth events this period"
              }
            />
            <DetailRow
              label="Balances"
              value={`${formatReportMoney(member.walletCurrency, member.walletBalance)} wallet · ${formatReportCount(member.credits)} credits`}
            />
            <div className="sm:col-span-2">
              <DetailRow label="Sender IDs" value={<SenderPills items={report.senderIdDetails} />} />
            </div>
          </dl>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard
            title="SMS volume"
            description={`Messages created each day, ${periodLabel(report.periodDays).toLowerCase()}.`}
            icon={BarChart3}
          >
            <DailySmsChart data={report.charts.smsVolume} />
          </SectionCard>
          <SectionCard
            title="Delivery mix"
            description="How this period's messages ended."
            icon={CheckCircle2}
          >
            <DeliveryPieChart data={report.charts.deliveryChart} showDetails />
          </SectionCard>
        </div>

        <SectionCard
          title="Status breakdown"
          description="Count and share for every delivery status."
          icon={MessageSquare}
        >
          {report.charts.deliveryChart.length === 0 ? (
            <EmptyNote
              action={{ label: "Send SMS", href: "/dashboard/send" }}
            >
              No messages in this period.
            </EmptyNote>
          ) : (
            <ReportTable columns={["Status", "Messages", "Share"]}>
              {report.charts.deliveryChart.map((row) => (
                <tr key={row.name} className="border-b border-border/40 last:border-0">
                  <td className="px-2 py-2.5">
                    <StatusBadge status={row.name} />
                  </td>
                  <td className="px-2 py-2.5 tabular-nums">{formatReportCount(row.value)}</td>
                  <td className="px-2 py-2.5 tabular-nums text-muted-foreground">
                    {mixTotal > 0 ? `${((row.value / mixTotal) * 100).toFixed(1)}%` : "0.0%"}
                  </td>
                </tr>
              ))}
            </ReportTable>
          )}
        </SectionCard>

        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Countries" description="Where messages were sent." icon={Megaphone}>
            {report.charts.countries.length === 0 ? (
              <EmptyNote>No country data yet.</EmptyNote>
            ) : (
              <CountryBarChart data={report.charts.countries} />
            )}
          </SectionCard>
          <SectionCard
            title="Sender ID usage"
            description="Which Sender IDs carried traffic."
            icon={Send}
          >
            {report.charts.senderUsage.length === 0 ? (
              <EmptyNote
                action={{ label: "Manage Sender IDs", href: "/dashboard/sender-ids" }}
              >
                No sender traffic in this period.
              </EmptyNote>
            ) : (
              <ul className="space-y-2.5">
                {report.charts.senderUsage.map((row) => {
                  const share =
                    kpis.messages > 0 ? Math.round((row.count / kpis.messages) * 100) : 0;
                  return (
                    <li key={row.senderId} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-mono text-[13px]">{row.senderId}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {formatReportCount(row.count)} ({share}%)
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${share}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard
            title="Failure reasons"
            description="Why messages did not deliver."
            icon={ShieldAlert}
          >
            {report.charts.failureReasons.length === 0 ? (
              <EmptyNote>No failure reasons this period.</EmptyNote>
            ) : (
              <ReasonBarChart data={report.charts.failureReasons} />
            )}
          </SectionCard>
          <SectionCard
            title="Recent failed SMS"
            description="Latest undelivered messages."
            icon={MessageSquare}
            action={
              <Link
                href={`${BASE}/delivery?days=${report.periodDays}`}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Full delivery →
              </Link>
            }
          >
            <FailuresTable rows={report.recentFailures.slice(0, 8)} compact />
          </SectionCard>
        </div>

        <SectionCard
          title="Recent messages"
          description="Last 40 messages in this period — status, sender, country, and units."
          icon={MessageSquare}
          action={
            <Link
              href="/dashboard/reports"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Live message log →
            </Link>
          }
        >
          <MessagesTable rows={report.recentMessages} />
        </SectionCard>

        <SectionCard
          title="Transactions"
          description={`${formatReportCount(kpis.transactions)} in this period. Showing the latest ${Math.min(12, report.transactions.length)}.`}
          icon={Coins}
          action={
            <Link
              href={`${BASE}/transactions?days=${report.periodDays}`}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Full ledger →
            </Link>
          }
        >
          <TransactionsTable rows={report.transactions.slice(0, 12)} />
        </SectionCard>

        <SectionCard
          title="Login activity"
          description={`${formatReportCount(kpis.logins)} auth events in this period.`}
          icon={ShieldCheck}
          action={
            <Link
              href={`${BASE}/logins?days=${report.periodDays}`}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Full login report →
            </Link>
          }
        >
          <LoginsTable rows={report.logins.slice(0, 12)} />
        </SectionCard>
      </div>
    </Shell>
  );
}

function MessagesTable({
  rows,
}: {
  rows: MemberAccountReport["recentMessages"];
}) {
  if (rows.length === 0) {
    return <EmptyNote>No messages in this period.</EmptyNote>;
  }
  return (
    <ReportTable columns={["When", "To", "Status", "Sender", "Country", "Units", "Detail"]}>
      {rows.map((row, i) => (
        <tr key={`${row.recipient}-${row.createdAt.toISOString()}-${i}`} className="border-b border-border/40 last:border-0 align-top">
          <td className="px-2 py-2.5 whitespace-nowrap tabular-nums text-muted-foreground">
            {format(row.createdAt, "MMM d, HH:mm")}
          </td>
          <td className="px-2 py-2.5 font-medium whitespace-nowrap">{row.recipient}</td>
          <td className="px-2 py-2.5">
            <StatusBadge status={row.status} />
          </td>
          <td className="px-2 py-2.5 font-mono text-[12px]">{row.senderId}</td>
          <td className="px-2 py-2.5 text-muted-foreground">{row.country}</td>
          <td className="px-2 py-2.5 tabular-nums">{row.smsUnits}</td>
          <td className="px-2 py-2.5 text-xs text-muted-foreground max-w-[240px]">
            {row.reason ?? row.preview}
          </td>
        </tr>
      ))}
    </ReportTable>
  );
}

function FailuresTable({
  rows,
  compact,
}: {
  rows: MemberAccountReport["recentFailures"];
  compact?: boolean;
}) {
  if (rows.length === 0) {
    return <EmptyNote>No failed messages in this period.</EmptyNote>;
  }
  return (
    <ReportTable
      columns={
        compact
          ? ["When", "To", "Reason"]
          : ["When", "To", "Sender", "Country", "Units", "Reason"]
      }
    >
      {rows.map((row, i) => (
        <tr key={`${row.recipient}-${i}`} className="border-b border-border/40 last:border-0 align-top">
          <td className="px-2 py-2.5 whitespace-nowrap tabular-nums text-muted-foreground">
            {format(row.createdAt, "MMM d, HH:mm")}
          </td>
          <td className="px-2 py-2.5 font-medium whitespace-nowrap">{row.recipient}</td>
          {compact ? null : (
            <>
              <td className="px-2 py-2.5 font-mono text-[12px]">{row.senderId}</td>
              <td className="px-2 py-2.5 text-muted-foreground">{row.country}</td>
              <td className="px-2 py-2.5 tabular-nums">{row.smsUnits}</td>
            </>
          )}
          <td className="px-2 py-2.5 text-xs text-muted-foreground">{row.reason}</td>
        </tr>
      ))}
    </ReportTable>
  );
}

function TransactionsTable({
  rows,
}: {
  rows: MemberAccountReport["transactions"];
}) {
  if (rows.length === 0) {
    return <EmptyNote>No transactions in this period.</EmptyNote>;
  }
  return (
    <ReportTable columns={["When", "Type", "Amount", "Credits", "Status", "Reference", "Note"]}>
      {rows.map((row) => {
        const meta = getTransactionMeta(row.type);
        return (
          <tr key={row.id} className="border-b border-border/40 last:border-0 align-top">
            <td className="px-2 py-2.5 whitespace-nowrap tabular-nums text-muted-foreground">
              {formatReportDateTime(row.createdAt)}
            </td>
            <td className="px-2 py-2.5 font-medium">{meta.label}</td>
            <td className="px-2 py-2.5 tabular-nums whitespace-nowrap">
              {formatTxAmount(row.amount, row.currency, meta.credit)}
            </td>
            <td className="px-2 py-2.5 tabular-nums">
              {row.credits != null ? formatReportCount(row.credits) : "-"}
            </td>
            <td className="px-2 py-2.5">{formatReportToken(row.status)}</td>
            <td className="px-2 py-2.5 font-mono text-[11px] text-muted-foreground">
              {row.reference || "-"}
            </td>
            <td className="px-2 py-2.5 text-xs text-muted-foreground max-w-[220px]">
              {row.description || "-"}
            </td>
          </tr>
        );
      })}
    </ReportTable>
  );
}

function LoginsTable({ rows }: { rows: MemberAccountReport["logins"] }) {
  if (rows.length === 0) {
    return <EmptyNote>No login events in this period.</EmptyNote>;
  }
  return (
    <ReportTable columns={["When", "Event", "Detail"]}>
      {rows.map((row) => (
        <tr key={row.id} className="border-b border-border/40 last:border-0 align-top">
          <td className="px-2 py-2.5 whitespace-nowrap tabular-nums text-muted-foreground">
            {formatReportDateTime(row.createdAt)}
          </td>
          <td className="px-2 py-2.5 font-medium">{formatAuthEvent(row.action)}</td>
          <td className="px-2 py-2.5 text-xs text-muted-foreground">
            {loginMetaSummary(row.metadata) || row.action}
          </td>
        </tr>
      ))}
    </ReportTable>
  );
}

export function MemberDeliveryReportView({
  report,
}: {
  report: MemberAccountReport;
}) {
  const { kpis } = report;
  const deliveryRate = formatDeliveryRate(kpis.delivered, kpis.messages);
  const mixTotal = report.charts.deliveryChart.reduce((sum, row) => sum + row.value, 0);
  const ratePct = kpis.messages > 0 ? (kpis.delivered / kpis.messages) * 100 : 0;
  const quiet = kpis.messages === 0;
  const needsAttention = kpis.failed > 0 && ratePct < 70;

  return (
    <Shell
      title="Delivery report"
      description={`Delivery performance for ${periodLabel(report.periodDays).toLowerCase()}. ${formatReportCount(kpis.messages)} messages, ${deliveryRate} delivered.`}
      period={report.periodDays}
      current={`${BASE}/delivery`}
    >
      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border/50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
                  quiet
                    ? "bg-muted text-muted-foreground ring-border/60"
                    : needsAttention
                      ? "bg-destructive/10 text-destructive ring-destructive/20"
                      : ratePct >= 90
                        ? "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300"
                        : "bg-primary/10 text-primary ring-primary/15",
                )}
              >
                {quiet ? (
                  <MessageSquare className="h-4 w-4" />
                ) : needsAttention ? (
                  <ShieldAlert className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
              </span>
              <div>
                <p className="text-sm font-semibold">
                  {quiet
                    ? "No delivery traffic this period"
                    : needsAttention
                      ? "Delivery needs attention"
                      : ratePct >= 90
                        ? "Strong delivery"
                        : "Delivery snapshot"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {quiet
                    ? kpis.lastMessageAt
                      ? `Last send ${formatReportDate(kpis.lastMessageAt)} · ${formatReportCount(kpis.allTimeMessages)} all-time messages.`
                      : "Send SMS to populate delivery analytics for this window."
                    : `${formatReportCount(kpis.messages)} messages · ${deliveryRate} delivered · ${formatReportCount(kpis.smsUnits)} units · avg ${kpis.avgUnitsPerMessage}/msg`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard/reports"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-9 gap-1.5 rounded-xl",
                )}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Message results
              </Link>
              <Link
                href="/dashboard/send"
                className={cn(buttonVariants({ size: "sm" }), "h-9 gap-1.5 rounded-xl")}
              >
                <Send className="h-3.5 w-3.5" />
                Send SMS
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
            {[
              {
                label: "Messages",
                value: formatReportCount(kpis.messages),
                hint: periodLabel(report.periodDays),
                tone: "primary" as const,
              },
              {
                label: "Delivered",
                value: formatReportCount(kpis.delivered),
                hint: deliveryRate,
                tone: "ok" as const,
              },
              {
                label: "Failed",
                value: formatReportCount(kpis.failed),
                hint: "Need review",
                tone: kpis.failed > 0 ? ("bad" as const) : ("neutral" as const),
              },
              {
                label: "Pending",
                value: formatReportCount(kpis.pending),
                hint: "In transit",
                tone: "neutral" as const,
              },
              {
                label: "Sent",
                value: formatReportCount(kpis.sent),
                hint: "Awaiting DLR",
                tone: "neutral" as const,
              },
              {
                label: "SMS units",
                value: formatReportCount(kpis.smsUnits),
                hint: `Avg ${kpis.avgUnitsPerMessage}/msg`,
                tone: "neutral" as const,
              },
            ].map(({ label, value, hint, tone }, index) => (
              <div
                key={label}
                className={cn(
                  "border-b border-border/50 p-3.5 xl:border-b-0",
                  index % 2 === 0 && "sm:border-r",
                  index < 5 && "xl:border-r",
                  index < 4 && "sm:border-b",
                  tone === "primary" && "bg-primary/[0.03]",
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <p
                  className={cn(
                    "mt-1.5 text-lg font-bold tabular-nums tracking-tight sm:text-xl",
                    tone === "primary" && "text-primary",
                    tone === "ok" && "text-emerald-700 dark:text-emerald-300",
                    tone === "bad" && "text-destructive",
                  )}
                >
                  {value}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              href: BASE,
              icon: FileBarChart2,
              title: "Overview",
              text: "Full account statement",
            },
            {
              href: "/dashboard/reports",
              icon: BarChart3,
              title: "Live message log",
              text: "Filter by status & campaign",
            },
            {
              href: "/dashboard/campaigns",
              icon: Megaphone,
              title: "Campaigns",
              text: "Bulk sends & schedules",
            },
          ].map(({ href, icon: Icon, title, text }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3.5 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/20"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{text}</span>
              </span>
            </Link>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard
            title="Status mix"
            description="How this period's messages ended."
            icon={CheckCircle2}
          >
            <DeliveryPieChart data={report.charts.deliveryChart} showDetails />
          </SectionCard>
          <SectionCard
            title="Failure reasons"
            description="Why messages did not deliver."
            icon={ShieldAlert}
          >
            {report.charts.failureReasons.length === 0 ? (
              <EmptyNote>No failure reasons this period.</EmptyNote>
            ) : (
              <ReasonBarChart data={report.charts.failureReasons} />
            )}
          </SectionCard>
          <SectionCard
            title="Countries"
            description="Where messages were sent."
            icon={Megaphone}
          >
            {report.charts.countries.length === 0 ? (
              <EmptyNote>No country data yet.</EmptyNote>
            ) : (
              <CountryBarChart data={report.charts.countries} />
            )}
          </SectionCard>
          <SectionCard
            title="SMS volume"
            description={`Messages created each day, ${periodLabel(report.periodDays).toLowerCase()}.`}
            icon={BarChart3}
          >
            <DailySmsChart data={report.charts.smsVolume} />
          </SectionCard>
        </div>

        <SectionCard
          title="Status breakdown"
          description="Count and share for every delivery status."
          icon={MessageSquare}
        >
          {report.charts.deliveryChart.length === 0 ? (
            <EmptyNote action={{ label: "Send SMS", href: "/dashboard/send" }}>
              No messages in this period.
            </EmptyNote>
          ) : (
            <ReportTable columns={["Status", "Messages", "Share"]}>
              {report.charts.deliveryChart.map((row) => (
                <tr key={row.name} className="border-b border-border/40 last:border-0">
                  <td className="px-2 py-2.5">
                    <StatusBadge status={row.name} />
                  </td>
                  <td className="px-2 py-2.5 tabular-nums">
                    {formatReportCount(row.value)}
                  </td>
                  <td className="px-2 py-2.5 tabular-nums text-muted-foreground">
                    {mixTotal > 0
                      ? `${((row.value / mixTotal) * 100).toFixed(1)}%`
                      : "0.0%"}
                  </td>
                </tr>
              ))}
            </ReportTable>
          )}
        </SectionCard>

        <SectionCard
          title="Sender ID usage"
          description="Which Sender IDs carried traffic."
          icon={Send}
        >
          {report.charts.senderUsage.length === 0 ? (
            <EmptyNote
              action={{ label: "Manage Sender IDs", href: "/dashboard/sender-ids" }}
            >
              No sender traffic in this period.
            </EmptyNote>
          ) : (
            <ul className="space-y-2.5">
              {report.charts.senderUsage.map((row) => {
                const share =
                  kpis.messages > 0 ? Math.round((row.count / kpis.messages) * 100) : 0;
                return (
                  <li key={row.senderId} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-mono text-[13px]">{row.senderId}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatReportCount(row.count)} ({share}%)
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Failed messages"
          description="Recipient, sender, country, units, and recorded reason."
          icon={ShieldAlert}
          action={
            kpis.failed > 0 ? (
              <Link
                href="/dashboard/reports?status=FAILED"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Open in message results →
              </Link>
            ) : null
          }
        >
          <FailuresTable rows={report.recentFailures} />
        </SectionCard>

        <SectionCard
          title="Recent messages"
          description="Latest traffic in this period — status, sender, country, and units."
          icon={MessageSquare}
          action={
            <Link
              href="/dashboard/reports"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Live message log →
            </Link>
          }
        >
          <MessagesTable rows={report.recentMessages} />
        </SectionCard>
      </div>
    </Shell>
  );
}

export function MemberTransactionsReportView({
  report,
}: {
  report: MemberAccountReport;
}) {
  const { member, kpis, transactions } = report;
  const days = dayLabels(report.periodDays);
  const volume = countByDay(
    transactions.map((t) => ({ createdAt: t.createdAt })),
    days,
  );

  let moneyIn = 0;
  let moneyOut = 0;
  let creditsMoved = 0;
  let topups = 0;
  let smsDebits = 0;
  const typeCounts = new Map<string, number>();

  for (const row of transactions) {
    const meta = getTransactionMeta(row.type);
    typeCounts.set(row.type, (typeCounts.get(row.type) ?? 0) + 1);
    if (meta.filter === "in") moneyIn += Math.abs(row.amount);
    if (meta.filter === "out") moneyOut += Math.abs(row.amount);
    if (row.credits != null) creditsMoved += Math.abs(row.credits);
    if (row.type === "WALLET_TOPUP" || row.type === "PROMO_CREDIT") topups += 1;
    if (row.type === "SMS_DEBIT") smsDebits += 1;
  }

  const typeBreakdown = [...typeCounts.entries()]
    .map(([type, count]) => ({ type, count, label: getTransactionMeta(type).label }))
    .sort((a, b) => b.count - a.count);

  const quiet = transactions.length === 0;
  const currency = member.walletCurrency;

  return (
    <Shell
      title="Transactions report"
      description={`Wallet and credit activity for ${periodLabel(report.periodDays).toLowerCase()}. ${formatReportCount(kpis.transactions)} transactions.`}
      period={report.periodDays}
      current={`${BASE}/transactions`}
    >
      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border/50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
                  quiet
                    ? "bg-muted text-muted-foreground ring-border/60"
                    : "bg-primary/10 text-primary ring-primary/15",
                )}
              >
                {quiet ? <Wallet className="h-4 w-4" /> : <Coins className="h-4 w-4" />}
              </span>
              <div>
                <p className="text-sm font-semibold">
                  {quiet ? "No billing activity this period" : "Billing snapshot"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {quiet
                    ? `Wallet ${formatReportMoney(currency, member.walletBalance)} · ${formatReportCount(member.credits)} SMS credits ready.`
                    : `${formatReportCount(transactions.length)} transactions · ${formatReportMoney(currency, moneyIn)} in · ${formatReportMoney(currency, moneyOut)} out.`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard/transactions"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-9 gap-1.5 rounded-xl",
                )}
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                Full history
              </Link>
              <Link
                href="/dashboard/wallet"
                className={cn(buttonVariants({ size: "sm" }), "h-9 gap-1.5 rounded-xl")}
              >
                <Wallet className="h-3.5 w-3.5" />
                Top up wallet
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
            {[
              {
                label: "Wallet",
                value: formatReportMoney(currency, member.walletBalance),
                hint: "Available now",
                tone: "primary" as const,
              },
              {
                label: "SMS credits",
                value: formatReportCount(member.credits),
                hint: "Balance left",
                tone: "neutral" as const,
              },
              {
                label: "Transactions",
                value: formatReportCount(kpis.transactions),
                hint: periodLabel(report.periodDays),
                tone: "neutral" as const,
              },
              {
                label: "Money in",
                value: formatReportMoney(currency, moneyIn),
                hint: "Top-ups & credits",
                tone: "ok" as const,
              },
              {
                label: "Money out",
                value: formatReportMoney(currency, moneyOut),
                hint: "Purchases & debits",
                tone: moneyOut > 0 ? ("bad" as const) : ("neutral" as const),
              },
              {
                label: "Credits moved",
                value: formatReportCount(creditsMoved),
                hint: `${formatReportCount(topups)} top-ups · ${formatReportCount(smsDebits)} SMS`,
                tone: "neutral" as const,
              },
            ].map(({ label, value, hint, tone }, index) => (
              <div
                key={label}
                className={cn(
                  "border-b border-border/50 p-3.5 xl:border-b-0",
                  index % 2 === 0 && "sm:border-r",
                  index < 5 && "xl:border-r",
                  index < 4 && "sm:border-b",
                  tone === "primary" && "bg-primary/[0.03]",
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <p
                  className={cn(
                    "mt-1.5 text-lg font-bold tabular-nums tracking-tight sm:text-xl",
                    tone === "primary" && "text-primary",
                    tone === "ok" && "text-emerald-700 dark:text-emerald-300",
                    tone === "bad" && "text-destructive",
                  )}
                >
                  {value}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              href: BASE,
              icon: FileBarChart2,
              title: "Overview",
              text: "Full account statement",
            },
            {
              href: "/dashboard/wallet",
              icon: Wallet,
              title: "Wallet",
              text: "Add money or buy credits",
            },
            {
              href: "/dashboard/invoices",
              icon: Coins,
              title: "Invoices",
              text: "Receipts and billing docs",
            },
          ].map(({ href, icon: Icon, title, text }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3.5 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/20"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{text}</span>
              </span>
            </Link>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard
            title="Activity over time"
            description={`Transactions per day, ${periodLabel(report.periodDays).toLowerCase()}.`}
            icon={BarChart3}
          >
            <SimpleLineChart data={volume} />
          </SectionCard>
          <SectionCard
            title="By type"
            description="How activity broke down this period."
            icon={ArrowLeftRight}
          >
            {typeBreakdown.length === 0 ? (
              <EmptyNote action={{ label: "Top up wallet", href: "/dashboard/wallet" }}>
                No transactions in this period.
              </EmptyNote>
            ) : (
              <ul className="space-y-2.5">
                {typeBreakdown.map((row) => {
                  const share =
                    transactions.length > 0
                      ? Math.round((row.count / transactions.length) * 100)
                      : 0;
                  return (
                    <li key={row.type} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">{row.label}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {formatReportCount(row.count)} ({share}%)
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${share}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </div>

        <SectionCard
          title="Transaction ledger"
          description="Type, amount, credits, status, reference, and note."
          icon={Coins}
          action={
            <Link
              href="/dashboard/transactions"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Full history →
            </Link>
          }
        >
          <TransactionsTable rows={transactions} />
        </SectionCard>
      </div>
    </Shell>
  );
}

export function MemberLoginsReportView({
  report,
}: {
  report: MemberAccountReport;
}) {
  const since = daysAgo(report.periodDays);
  const days = dayLabels(report.periodDays);
  const volume = countByDay(
    report.logins.filter((l) => l.createdAt >= since),
    days,
  );

  return (
    <Shell
      title="Logins report"
      description={`Authentication activity for ${periodLabel(report.periodDays).toLowerCase()}. ${formatReportCount(report.kpis.logins)} events.`}
      period={report.periodDays}
      current={`${BASE}/logins`}
    >
      <div className="space-y-4">
        <StatTile label="Auth events" value={formatReportCount(report.kpis.logins)} />
        <AppCard>
          <AppCardBody className="py-5 sm:py-6">
            <AppCardTitle title="Auth events over time" className="mb-4 sm:mb-5" />
            <SimpleLineChart data={volume} />
          </AppCardBody>
        </AppCard>
        <AppCard>
          <AppCardBody className="py-5 sm:py-6">
            <AppCardTitle
              title="Event log"
              description="Sign-ins, failed attempts, password changes, and verification events."
              className="mb-4 sm:mb-5"
            />
            <LoginsTable rows={report.logins} />
          </AppCardBody>
        </AppCard>
      </div>
    </Shell>
  );
}
