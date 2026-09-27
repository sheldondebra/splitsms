"use client";

import Link from "next/link";
import { useState } from "react";
import { BarChart3, Send } from "lucide-react";
import { DailySmsChart, DeliveryPieChart } from "@/components/dashboard/charts";
import { cn } from "@/lib/utils";

type ChartTab = "volume" | "delivery";

type DashboardChartsPanelProps = {
  dailySms: { date: string; sent?: number }[];
  deliveryChart: { name: string; value: number; fill?: string }[];
  messagesToday: number;
  deliveryRate: number;
  delivered?: number;
  failed?: number;
  pending?: number;
  totalMessages?: number;
};

export function DashboardChartsPanel({
  dailySms,
  deliveryChart,
  messagesToday,
  deliveryRate,
  delivered = 0,
  failed = 0,
  pending = 0,
  totalMessages = 0,
}: DashboardChartsPanelProps) {
  const [tab, setTab] = useState<ChartTab>("volume");
  const total14d = dailySms.reduce((n, d) => n + (d.sent ?? 0), 0);
  const deliveryTotal = deliveryChart.reduce((n, d) => n + d.value, 0);
  const showEmpty =
    (tab === "volume" && total14d === 0) || (tab === "delivery" && deliveryTotal === 0);

  const summaryStats =
    tab === "volume"
      ? [
          { label: "Today", value: messagesToday.toLocaleString() },
          { label: "14 days", value: total14d.toLocaleString() },
          { label: "Delivered", value: `${deliveryRate}%` },
        ]
      : [
          { label: "Delivered", value: delivered.toLocaleString() },
          { label: "Failed", value: failed.toLocaleString() },
          { label: "Pending", value: pending.toLocaleString() },
        ];

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border/50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
            <BarChart3 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Analytics</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Last 14 days of send volume and delivery.</p>
          </div>
        </div>
        <div className="inline-flex self-start rounded-xl border border-border/60 bg-muted/30 p-1">
          {(
            [
              { id: "volume" as const, label: "SMS volume" },
              { id: "delivery" as const, label: "Delivery" },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                tab === id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border/50 border-b border-border/50">
        {summaryStats.map((stat) => (
          <div key={stat.label} className="px-4 py-3 sm:px-5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {showEmpty ? (
        <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border/60">
            <Send className="h-4 w-4" />
          </span>
          <p className="text-sm font-semibold">
            {tab === "volume" ? "No sends in the last 14 days" : "No delivery data yet"}
          </p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            {tab === "volume"
              ? "Volume charts will appear once you start messaging again."
              : "Delivery breakdown appears after messages are processed."}
          </p>
          <Link
            href="/dashboard/send"
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Send className="h-3.5 w-3.5" />
            Send SMS
          </Link>
        </div>
      ) : (
        <>
          <div className="h-[240px] px-2 pb-4 pt-2 sm:h-[260px]">
            {tab === "volume" ? (
              <DailySmsChart data={dailySms} />
            ) : (
              <DeliveryPieChart data={deliveryChart} compact showDetails />
            )}
          </div>
          {tab === "delivery" && deliveryTotal > 0 && (
            <p className="px-5 pb-4 text-[11px] text-muted-foreground">
              {deliveryRate}% delivery rate across {totalMessages.toLocaleString()} total messages.
            </p>
          )}
        </>
      )}
    </div>
  );
}
