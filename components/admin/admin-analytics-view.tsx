import Link from "next/link";
import {
  AdminPage,
  AdminPageHeader,
  AdminStatCard,
  AdminCard,
  AdminListRow,
  AdminEmpty,
  AdminAlert,
} from "@/components/admin/admin-page-shell";
import { AdminVolumeChart } from "@/components/dashboard/admin-volume-chart";
import { AdminRevenueChart } from "@/components/admin/admin-revenue-chart";
import { AdminSignupsChart } from "@/components/admin/admin-signups-chart";
import { DeliveryPieChart, CountryBarChart } from "@/components/dashboard/charts";
import type { getAdminAnalyticsDashboard } from "@/lib/admin/analytics";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  DollarSign,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Users,
  UserPlus,
  Radio,
  ScrollText,
  ShieldAlert,
  Receipt,
  ArrowRight,
  Activity,
} from "lucide-react";

type AnalyticsData = Awaited<ReturnType<typeof getAdminAnalyticsDashboard>>;

function PeriodTabs({
  current,
  options,
}: {
  current: number;
  options: number[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-xl border border-border/60 bg-muted/20 p-1">
      {options.map((d) => (
        <Link
          key={d}
          href={`/admin/analytics?days=${d}`}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
            current === d
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
          )}
        >
          {d}d
        </Link>
      ))}
    </div>
  );
}

export function AdminAnalyticsView({ data }: { data: AnalyticsData }) {
  const { summary, period, charts, periodDays, topSpenders, topMembersByVolume, fraudFlags, revenueByCountry, mnotify } =
    data;

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Analytics"
        description="Revenue, SMS volume, delivery health, growth, and top members — filter by time range below."
        icon={BarChart3}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PeriodTabs current={periodDays} options={data.periodOptions} />
            <Link
              href="/admin/billing"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
            >
              <Receipt className="h-3.5 w-3.5" />
              Billing
            </Link>
          </div>
        }
      />

      {!mnotify.configured && (
        <AdminAlert variant="warning">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm">
              SMS gateway is not configured — delivery stats may be incomplete until mNotify is connected.
            </p>
            <Link href="/admin/providers" className={cn(buttonVariants({ size: "sm" }))}>
              Configure gateway
            </Link>
          </div>
        </AdminAlert>
      )}

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Last {periodDays} days
        </p>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <AdminStatCard
            label="Deposits"
            value={`GHS ${period.deposits.toFixed(2)}`}
            hint={`${period.depositCount} transactions`}
            icon={DollarSign}
            variant="primary"
          />
          <AdminStatCard
            label="SMS revenue"
            value={`GHS ${period.smsRevenue.toFixed(2)}`}
            icon={MessageSquare}
          />
          <AdminStatCard
            label="Est. profit"
            value={`GHS ${period.estimatedProfit.toFixed(2)}`}
            hint={`Provider ~GHS ${period.estimatedProviderCost.toFixed(2)}`}
            icon={TrendingUp}
          />
          <AdminStatCard
            label="Messages"
            value={summary.messagesInPeriod.toLocaleString()}
            hint={`${summary.periodDeliveryRate}% delivered · ${summary.messagesToday} today`}
            icon={Activity}
          />
          <AdminStatCard
            label="New members"
            value={summary.newMembersInPeriod}
            icon={UserPlus}
          />
          <AdminStatCard
            label="Failed (period)"
            value={summary.failedInPeriod.toLocaleString()}
            variant={summary.failedInPeriod > 0 ? "warning" : "default"}
            icon={AlertTriangle}
          />
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Platform totals
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatCard
            label="All-time deposits"
            value={`GHS ${summary.allTimeDeposits.toFixed(2)}`}
            hint={`SMS spend GHS ${summary.allTimeSmsSpend.toFixed(2)}`}
          />
          <AdminStatCard
            label="All-time messages"
            value={summary.allTimeMessages.toLocaleString()}
            hint={`${summary.allTimeFailureRate}% failure rate`}
            variant={summary.allTimeFailureRate > 5 ? "danger" : "default"}
          />
          <AdminStatCard
            label="Members"
            value={summary.members.toLocaleString()}
            hint={`${summary.verifiedMembers} verified · ${summary.resellersApproved} resellers`}
            icon={Users}
          />
          <AdminStatCard
            label="API (24h)"
            value={summary.api24h.toLocaleString()}
            hint={
              summary.api24hFailed > 0
                ? `${summary.api24hFailed} errors`
                : "No errors"
            }
            icon={ScrollText}
            variant={summary.api24hFailed > 0 ? "warning" : "default"}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminCard
          title="SMS volume"
          description={`Daily messages · ${periodDays} day window`}
        >
          <AdminVolumeChart data={charts.dailyVolume} />
        </AdminCard>

        <AdminCard
          title="Revenue trend"
          description="Deposits vs SMS spend per day"
        >
          <AdminRevenueChart data={charts.dailyRevenue} />
        </AdminCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <AdminCard title="Delivery mix" description="Message statuses in period">
          <DeliveryPieChart data={charts.deliveryChart} compact />
        </AdminCard>

        <AdminCard title="Top countries" description="SMS units by destination">
          <CountryBarChart data={charts.countryChart} />
        </AdminCard>

        <AdminCard title="Member signups" description="New registrations per day">
          <AdminSignupsChart data={charts.dailySignups} />
        </AdminCard>
      </div>

      {charts.providerChart.length > 0 && (
        <AdminCard title="Provider usage" description="Messages routed by gateway in period">
          <div className="flex flex-wrap gap-3">
            {charts.providerChart.map((p) => {
              const total = charts.providerChart.reduce((s, x) => s + x.count, 0);
              const pct = total > 0 ? Math.round((p.count / total) * 100) : 0;
              return (
                <div
                  key={p.name}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/15 px-4 py-3 min-w-[140px]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Radio className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {p.count.toLocaleString()} · {pct}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </AdminCard>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard
          title="Top spenders"
          description={`Highest SMS debit volume · ${periodDays}d`}
          actions={
            <Link href="/admin/members" className="text-xs font-medium text-primary hover:underline">
              All members →
            </Link>
          }
        >
          {topSpenders.length === 0 ? (
            <AdminEmpty>No SMS spend in this period.</AdminEmpty>
          ) : (
            <div className="-my-1">
              {topSpenders.map((m, i) => (
                <AdminListRow key={m.userId}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold tabular-nums">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/members/${m.userId}`}
                        className="font-medium text-sm hover:text-primary transition-colors truncate block"
                      >
                        {m.name}
                      </Link>
                      <p className="text-xs text-muted-foreground font-mono truncate">{m.phone}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold tabular-nums shrink-0">
                    GHS {m.amount.toFixed(2)}
                  </span>
                </AdminListRow>
              ))}
            </div>
          )}
        </AdminCard>

        <AdminCard
          title="Most active senders"
          description={`By message count · ${periodDays}d`}
        >
          {topMembersByVolume.length === 0 ? (
            <AdminEmpty>No messages in this period.</AdminEmpty>
          ) : (
            <div className="-my-1">
              {topMembersByVolume.map((m, i) => (
                <AdminListRow key={m.userId}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold tabular-nums">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/members/${m.userId}`}
                        className="font-medium text-sm hover:text-primary transition-colors truncate block"
                      >
                        {m.name}
                      </Link>
                      <p className="text-xs text-muted-foreground font-mono truncate">{m.phone}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold tabular-nums shrink-0">
                    {m.messages.toLocaleString()} msgs
                  </span>
                </AdminListRow>
              ))}
            </div>
          )}
        </AdminCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {revenueByCountry.length > 0 && (
          <AdminCard title="Revenue by country" description="From delivered/sent messages">
            <div className="-my-1">
              {revenueByCountry.map((c) => (
                <AdminListRow key={c.code}>
                  <span className="font-mono font-semibold">{c.code}</span>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    GHS {c.revenue.toFixed(2)} · {c.count} units
                  </span>
                </AdminListRow>
              ))}
            </div>
          </AdminCard>
        )}

        <AdminCard
          title="Risk watchlist"
          description="Elevated failure rates (7d) — full list on Fraud"
          actions={
            <Link
              href="/admin/fraud"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
            >
              Fraud panel
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {fraudFlags.length === 0 ? (
            <AdminEmpty>No elevated-risk accounts.</AdminEmpty>
          ) : (
            <div className="-my-1">
              {fraudFlags.map((f) => (
                <AdminListRow key={f.userId}>
                  <div className="min-w-0">
                    <Link
                      href={`/admin/members/${f.userId}`}
                      className="font-medium text-sm hover:text-primary"
                    >
                      {f.fullName}
                    </Link>
                    <p className="text-xs text-muted-foreground">{f.phone}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant={f.risk === "HIGH" ? "destructive" : "outline"}>{f.risk}</Badge>
                    <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                      {f.failureRate}% failed
                    </p>
                  </div>
                </AdminListRow>
              ))}
            </div>
          )}
        </AdminCard>
      </div>

      <AdminCard title="Operational shortcuts">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              href: "/admin/api-logs",
              label: "API logs",
              hint: `${summary.api24h} req / 24h`,
              icon: ScrollText,
            },
            {
              href: "/admin/payments",
              label: "Pending payments",
              hint: String(summary.pendingPayments),
              icon: Receipt,
              warn: summary.pendingPayments > 0,
            },
            {
              href: "/admin/billing",
              label: "Billing & promos",
              hint: "Revenue tools",
              icon: DollarSign,
            },
            {
              href: "/admin/fraud",
              label: "Fraud monitoring",
              hint: `${fraudFlags.length} flagged`,
              icon: ShieldAlert,
              warn: fraudFlags.length > 0,
            },
          ].map(({ href, label, hint, icon: Icon, warn }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl border border-border/60 px-4 py-3.5 hover:border-primary/30 hover:bg-muted/30 transition-colors group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{label}</p>
                <p
                  className={cn(
                    "text-xs tabular-nums",
                    warn ? "text-amber-700 dark:text-amber-300 font-medium" : "text-muted-foreground",
                  )}
                >
                  {hint}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </AdminCard>
    </AdminPage>
  );
}
