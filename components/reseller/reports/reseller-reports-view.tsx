"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Coins,
  Percent,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import type { ResellerReportsDashboard } from "@/lib/reseller/reports-dashboard";
import { ResellerReportsCharts } from "@/components/reseller/reports/reseller-reports-charts";
import {
  ResellerCard,
  ResellerPage,
  ResellerPageHeader,
  ResellerStatCard,
} from "@/components/reseller/reseller-page-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function money(currency: string, value: number) {
  return `${currency} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function ResellerReportsView({ data }: { data: ResellerReportsDashboard }) {
  return (
    <ResellerPage className="max-w-7xl">
      <ResellerPageHeader
        title="Reports"
        description={`Detailed ${data.days}-day business performance across SMS delivery, client funding, and commission.`}
        icon={BarChart3}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/reseller/transactions"
              className={cn(buttonVariants({ variant: "outline" }), "gap-1.5")}
            >
              Open ledger
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/reseller/wallet" className={cn(buttonVariants(), "gap-1.5")}>
              <Wallet className="h-4 w-4" />
              Wallet
            </Link>
          </div>
        }
      />

      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/12 via-card to-card p-5 shadow-sm md:p-7">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <Badge className="mb-3 bg-primary/15 text-primary hover:bg-primary/15">
              Performance report
            </Badge>
            <h2 className="max-w-2xl text-2xl font-bold tracking-tight md:text-3xl">
              See how your reseller network is performing.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Track delivery quality by client, funding allocation, gateway mix, and commission
              earned — all from the last {data.days} days.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">Delivery rate</p>
              <p className="mt-1 text-3xl font-bold">{data.stats.deliveryRate}%</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">SMS volume</p>
              <p className="mt-1 text-3xl font-bold">{data.stats.totalSms.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">Commission</p>
              <p className="mt-1 text-2xl font-bold">
                {money(data.currency, data.stats.commissionEarned)}
              </p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">Funded out</p>
              <p className="mt-1 text-2xl font-bold">
                {money(data.currency, data.stats.fundedOut)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ResellerStatCard
          label="Delivered"
          value={data.stats.delivered.toLocaleString()}
          hint={`${data.stats.creditsUsed.toLocaleString()} credit units used`}
          accent
        />
        <ResellerStatCard
          label="Failed"
          value={data.stats.failed.toLocaleString()}
          hint={`${data.stats.pending.toLocaleString()} pending / processing`}
        />
        <ResellerStatCard
          label="Active clients"
          value={data.stats.activeClients}
          hint={`${data.stats.totalClients} total accounts`}
        />
        <ResellerStatCard
          label="Unpaid commission"
          value={money(data.currency, data.unpaid)}
          hint={`${data.stats.fundingEvents} funding events`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: CheckCircle2,
            label: "Healthy delivery",
            value: `${data.stats.deliveryRate}%`,
            tone: "text-emerald-600",
          },
          {
            icon: XCircle,
            label: "Failed messages",
            value: data.stats.failed.toLocaleString(),
            tone: "text-destructive",
          },
          {
            icon: Coins,
            label: "Commission earned",
            value: money(data.currency, data.stats.commissionEarned),
            tone: "text-primary",
          },
          {
            icon: Percent,
            label: "Wallet balance",
            value: money(data.currency, data.walletBalance),
            tone: "text-foreground",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm"
          >
            <item.icon className={cn("h-5 w-5", item.tone)} />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
              <p className="text-sm font-bold">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <ResellerReportsCharts charts={data.charts} currency={data.currency} />

      <div className="grid gap-4 xl:grid-cols-2">
        <ResellerCard
          title="SMS delivery by users"
          description="Full client delivery table for the selected period"
        >
          {data.tables.deliveryByUser.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No SMS delivery data yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 font-semibold">Client</th>
                    <th className="pb-2 font-semibold">Total</th>
                    <th className="pb-2 font-semibold">Delivered</th>
                    <th className="pb-2 font-semibold">Failed</th>
                    <th className="pb-2 font-semibold">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tables.deliveryByUser.map((row) => (
                    <tr key={row.userId} className="border-b border-border/40 last:border-0">
                      <td className="py-2.5">
                        <Link
                          href={`/reseller/users/${row.userId}`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {row.name}
                        </Link>
                      </td>
                      <td className="py-2.5 tabular-nums">{row.total.toLocaleString()}</td>
                      <td className="py-2.5 tabular-nums text-emerald-700 dark:text-emerald-400">
                        {row.delivered.toLocaleString()}
                      </td>
                      <td className="py-2.5 tabular-nums text-destructive">
                        {row.failed.toLocaleString()}
                      </td>
                      <td className="py-2.5">
                        <Badge
                          variant="secondary"
                          className={cn(
                            row.deliveryRate >= 90
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              : row.deliveryRate >= 70
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                : "bg-destructive/15 text-destructive",
                          )}
                        >
                          {row.deliveryRate}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ResellerCard>

        <ResellerCard
          title="Top-up by user"
          description="Funding amount and credit allocations per client"
        >
          {data.tables.topupByUser.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No top-ups recorded in this period.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 font-semibold">Client</th>
                    <th className="pb-2 font-semibold">Amount</th>
                    <th className="pb-2 font-semibold">Credits</th>
                    <th className="pb-2 font-semibold">Events</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tables.topupByUser.map((row) => (
                    <tr key={row.userId} className="border-b border-border/40 last:border-0">
                      <td className="py-2.5">
                        <Link
                          href={`/reseller/users/${row.userId}`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {row.name}
                        </Link>
                      </td>
                      <td className="py-2.5 font-semibold tabular-nums">
                        {money(data.currency, row.amount)}
                      </td>
                      <td className="py-2.5 tabular-nums">{row.credits.toLocaleString()}</td>
                      <td className="py-2.5 tabular-nums">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ResellerCard>
      </div>

      <ResellerCard
        title="Client balance snapshot"
        description="Current credits, wallets, and period SMS volume"
      >
        {data.tables.clientBalances.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center">
            <Users className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold">No clients yet</p>
            <Link
              href="/reseller/users"
              className={cn(buttonVariants({ size: "sm" }), "mt-4 gap-1.5")}
            >
              Add clients
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 font-semibold">Client</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Credits</th>
                  <th className="pb-2 font-semibold">Wallet</th>
                  <th className="pb-2 font-semibold">SMS ({data.days}d)</th>
                  <th className="pb-2 font-semibold">Delivery</th>
                </tr>
              </thead>
              <tbody>
                {data.tables.clientBalances.map((row) => (
                  <tr key={row.userId} className="border-b border-border/40 last:border-0">
                    <td className="py-2.5">
                      <Link
                        href={`/reseller/users/${row.userId}`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {row.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{row.phone}</p>
                    </td>
                    <td className="py-2.5">
                      {row.isSuspended ? (
                        <Badge variant="destructive">Suspended</Badge>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </td>
                    <td className="py-2.5 tabular-nums">{row.credits.toLocaleString()}</td>
                    <td className="py-2.5 tabular-nums">{money(data.currency, row.wallet)}</td>
                    <td className="py-2.5 tabular-nums">{row.messages.toLocaleString()}</td>
                    <td className="py-2.5">
                      {row.deliveryRate == null ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                          <Activity className="h-3.5 w-3.5 text-primary" />
                          {row.deliveryRate}%
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ResellerCard>
    </ResellerPage>
  );
}
