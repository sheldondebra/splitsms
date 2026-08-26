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
  Download,
  FileBarChart2,
  Hash,
  Mail,
  Phone,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

const BASE = "/dashboard/account-reports";

function periodLabel(days: ReportPeriodDays) {
  return `Last ${days} days`;
}

function pdfHref(period: ReportPeriodDays) {
  return `/api/dashboard/account-reports/pdf?days=${period}&download=1`;
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-10 text-center text-sm text-muted-foreground">{children}</p>
  );
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 px-3.5 py-3">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight sm:text-2xl">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] items-start gap-3 py-2.5 border-b border-border/40 last:border-0 sm:grid-cols-[9rem_1fr]">
      <dt className="text-xs text-muted-foreground pt-0.5">{label}</dt>
      <dd className="text-sm font-medium min-w-0 break-words">{value || "Not set"}</dd>
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
    return <span className="text-muted-foreground font-normal">None registered</span>;
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
    <div className="overflow-x-auto -mx-1">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border/60 text-left text-[11px] font-medium text-muted-foreground">
            {columns.map((col) => (
              <th key={col} className="px-2 py-2 font-medium whitespace-nowrap">
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
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ReportPeriodTabs basePath={current} period={period} />
            <a
              href={pdfHref(period)}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-9 gap-1.5 rounded-xl")}
            >
              <Download className="h-4 w-4" />
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

export function MemberAccountReportsOverview({
  report,
}: {
  report: MemberAccountReport;
}) {
  const { member, kpis } = report;
  const deliveryRate = formatDeliveryRate(kpis.delivered, kpis.messages);
  const mixTotal = report.charts.deliveryChart.reduce((sum, row) => sum + row.value, 0);

  return (
    <Shell
      title="My reports"
      description={`Account statement for ${periodLabel(report.periodDays).toLowerCase()}, from ${formatReportDate(report.periodFrom)} to ${formatReportDate(report.periodTo)}.`}
      period={report.periodDays}
      current={BASE}
    >
      <div className="space-y-4">
        <AppCard>
          <AppCardBody className="py-5 sm:py-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="text-xl font-semibold tracking-tight sm:text-2xl">{member.fullName}</p>
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
                <Badge variant={member.isVerified ? "secondary" : "outline"} className="h-7 gap-1 rounded-lg">
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

            <dl className="mt-5 grid gap-x-8 sm:grid-cols-2">
              <DetailRow label="Member ID" value={member.accountId} />
              <DetailRow label="Phone" value={member.phone} />
              <DetailRow label="Email" value={member.email?.trim() || "No email on file"} />
              <DetailRow label="Country" value={member.countryName} />
              <DetailRow label="Account opened" value={formatReportDate(member.createdAt)} />
              <DetailRow
                label="Report window"
                value={`${formatReportDate(report.periodFrom)} to ${formatReportDate(report.periodTo)}`}
              />
              <div className="sm:col-span-2">
                <DetailRow label="Sender IDs" value={<SenderPills items={report.senderIdDetails} />} />
              </div>
            </dl>
          </AppCardBody>
        </AppCard>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Messages" value={formatReportCount(kpis.messages)} hint={`${formatReportCount(kpis.smsUnits)} SMS units`} />
          <StatTile label="Delivered" value={formatReportCount(kpis.delivered)} hint={`${deliveryRate} rate`} />
          <StatTile label="Failed" value={formatReportCount(kpis.failed)} />
          <StatTile label="Pending / sending" value={formatReportCount(kpis.pending)} />
          <StatTile label="Sent" value={formatReportCount(kpis.sent)} />
          <StatTile label="Campaigns" value={formatReportCount(kpis.campaigns)} />
          <StatTile label="SMS credits" value={formatReportCount(member.credits)} />
          <StatTile
            label="Wallet"
            value={formatReportMoney(member.walletCurrency, member.walletBalance)}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <AppCard>
            <AppCardBody className="py-5 sm:py-6">
              <AppCardTitle
                title="SMS volume"
                description={`Messages created each day, ${periodLabel(report.periodDays).toLowerCase()}.`}
                className="mb-4 sm:mb-5"
              />
              <DailySmsChart data={report.charts.smsVolume} />
            </AppCardBody>
          </AppCard>
          <AppCard>
            <AppCardBody className="py-5 sm:py-6">
              <AppCardTitle
                title="Delivery mix"
                description="How this period's messages ended."
                className="mb-4 sm:mb-5"
              />
              <DeliveryPieChart data={report.charts.deliveryChart} showDetails />
            </AppCardBody>
          </AppCard>
        </div>

        <AppCard>
          <AppCardBody className="py-5 sm:py-6">
            <AppCardTitle
              title="Status breakdown"
              description="Count and share for every delivery status."
              className="mb-4 sm:mb-5"
            />
            {report.charts.deliveryChart.length === 0 ? (
              <EmptyNote>No messages in this period.</EmptyNote>
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
          </AppCardBody>
        </AppCard>

        <div className="grid gap-4 lg:grid-cols-2">
          <AppCard>
            <AppCardBody className="py-5 sm:py-6">
              <AppCardTitle
                title="Countries"
                description="Where messages were sent."
                className="mb-4 sm:mb-5"
              />
              <CountryBarChart data={report.charts.countries} />
            </AppCardBody>
          </AppCard>
          <AppCard>
            <AppCardBody className="py-5 sm:py-6">
              <AppCardTitle
                title="Sender ID usage"
                description="Which Sender IDs carried traffic."
                className="mb-4 sm:mb-5"
              />
              {report.charts.senderUsage.length === 0 ? (
                <EmptyNote>No sender traffic in this period.</EmptyNote>
              ) : (
                <ul className="space-y-2">
                  {report.charts.senderUsage.map((row) => {
                    const share =
                      kpis.messages > 0 ? Math.round((row.count / kpis.messages) * 100) : 0;
                    return (
                      <li key={row.senderId} className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-mono text-[13px]">{row.senderId}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {formatReportCount(row.count)} ({share}%)
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </AppCardBody>
          </AppCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <AppCard>
            <AppCardBody className="py-5 sm:py-6">
              <AppCardTitle
                title="Failure reasons"
                description="Why messages did not deliver."
                className="mb-4 sm:mb-5"
              />
              <ReasonBarChart data={report.charts.failureReasons} />
            </AppCardBody>
          </AppCard>
          <AppCard>
            <AppCardBody className="py-5 sm:py-6">
              <div className="flex items-start justify-between gap-3 mb-4 sm:mb-5">
                <AppCardTitle
                  title="Recent failed SMS"
                  description="Latest undelivered messages."
                  className="mb-0"
                />
                <Link
                  href={`${BASE}/delivery?days=${report.periodDays}`}
                  className="shrink-0 text-xs font-semibold text-primary hover:underline"
                >
                  Full delivery report
                </Link>
              </div>
              <FailuresTable rows={report.recentFailures.slice(0, 8)} compact />
            </AppCardBody>
          </AppCard>
        </div>

        <AppCard>
          <AppCardBody className="py-5 sm:py-6">
            <AppCardTitle
              title="Recent messages"
              description="Last 40 messages in this period, with status, sender, country, and units."
              className="mb-4 sm:mb-5"
            />
            <MessagesTable rows={report.recentMessages} />
          </AppCardBody>
        </AppCard>

        <AppCard>
          <AppCardBody className="py-5 sm:py-6">
            <div className="flex items-start justify-between gap-3 mb-4 sm:mb-5">
              <AppCardTitle
                title="Transactions"
                description={`${formatReportCount(kpis.transactions)} in this period. Showing the latest ${report.transactions.length}.`}
                className="mb-0"
              />
              <Link
                href={`${BASE}/transactions?days=${report.periodDays}`}
                className="shrink-0 text-xs font-semibold text-primary hover:underline"
              >
                Full transactions
              </Link>
            </div>
            <TransactionsTable rows={report.transactions.slice(0, 12)} />
          </AppCardBody>
        </AppCard>

        <AppCard>
          <AppCardBody className="py-5 sm:py-6">
            <div className="flex items-start justify-between gap-3 mb-4 sm:mb-5">
              <AppCardTitle
                title="Login activity"
                description={`${formatReportCount(kpis.logins)} auth events in this period.`}
                className="mb-0"
              />
              <Link
                href={`${BASE}/logins?days=${report.periodDays}`}
                className="shrink-0 text-xs font-semibold text-primary hover:underline"
              >
                Full login report
              </Link>
            </div>
            <LoginsTable rows={report.logins.slice(0, 12)} />
          </AppCardBody>
        </AppCard>
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

  return (
    <Shell
      title="Delivery report"
      description={`Delivery performance for ${periodLabel(report.periodDays).toLowerCase()}. ${formatReportCount(kpis.messages)} messages, ${deliveryRate} delivered.`}
      period={report.periodDays}
      current={`${BASE}/delivery`}
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatTile label="Messages" value={formatReportCount(kpis.messages)} />
          <StatTile label="Delivered" value={formatReportCount(kpis.delivered)} hint={deliveryRate} />
          <StatTile label="Failed" value={formatReportCount(kpis.failed)} />
          <StatTile label="Pending / sending" value={formatReportCount(kpis.pending)} />
          <StatTile label="SMS units" value={formatReportCount(kpis.smsUnits)} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <AppCard>
            <AppCardBody className="py-5 sm:py-6">
              <AppCardTitle title="Status mix" className="mb-4 sm:mb-5" />
              <DeliveryPieChart data={report.charts.deliveryChart} showDetails />
            </AppCardBody>
          </AppCard>
          <AppCard>
            <AppCardBody className="py-5 sm:py-6">
              <AppCardTitle title="Failure reasons" className="mb-4 sm:mb-5" />
              <ReasonBarChart data={report.charts.failureReasons} />
            </AppCardBody>
          </AppCard>
          <AppCard>
            <AppCardBody className="py-5 sm:py-6">
              <AppCardTitle title="Countries" className="mb-4 sm:mb-5" />
              <CountryBarChart data={report.charts.countries} />
            </AppCardBody>
          </AppCard>
          <AppCard>
            <AppCardBody className="py-5 sm:py-6">
              <AppCardTitle title="SMS volume" className="mb-4 sm:mb-5" />
              <DailySmsChart data={report.charts.smsVolume} />
            </AppCardBody>
          </AppCard>
        </div>
        <AppCard>
          <AppCardBody className="py-5 sm:py-6">
            <AppCardTitle
              title="Failed messages"
              description="Recipient, sender, country, units, and recorded reason."
              className="mb-4 sm:mb-5"
            />
            <FailuresTable rows={report.recentFailures} />
          </AppCardBody>
        </AppCard>
        <AppCard>
          <AppCardBody className="py-5 sm:py-6">
            <AppCardTitle
              title="Recent messages"
              description="Latest traffic in this period."
              className="mb-4 sm:mb-5"
            />
            <MessagesTable rows={report.recentMessages} />
          </AppCardBody>
        </AppCard>
      </div>
    </Shell>
  );
}

export function MemberTransactionsReportView({
  report,
}: {
  report: MemberAccountReport;
}) {
  const days = dayLabels(report.periodDays);
  const volume = countByDay(
    report.transactions.map((t) => ({ createdAt: t.createdAt })),
    days,
  );

  return (
    <Shell
      title="Transactions report"
      description={`Wallet and credit activity for ${periodLabel(report.periodDays).toLowerCase()}. ${formatReportCount(report.kpis.transactions)} transactions.`}
      period={report.periodDays}
      current={`${BASE}/transactions`}
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile
            label="Wallet"
            value={formatReportMoney(report.member.walletCurrency, report.member.walletBalance)}
          />
          <StatTile label="SMS credits" value={formatReportCount(report.member.credits)} />
          <StatTile label="Transactions" value={formatReportCount(report.kpis.transactions)} />
        </div>
        <AppCard>
          <AppCardBody className="py-5 sm:py-6">
            <AppCardTitle title="Activity over time" className="mb-4 sm:mb-5" />
            <SimpleLineChart data={volume} />
          </AppCardBody>
        </AppCard>
        <AppCard>
          <AppCardBody className="py-5 sm:py-6">
            <AppCardTitle
              title="Transaction ledger"
              description="Type, amount, credits, status, reference, and note."
              className="mb-4 sm:mb-5"
            />
            <TransactionsTable rows={report.transactions} />
          </AppCardBody>
        </AppCard>
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
