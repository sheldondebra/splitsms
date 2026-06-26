"use client";

import { useState } from "react";
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
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 pt-5 pb-0">
        <div>
          <h2 className="text-sm font-semibold">Analytics</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Last 14 days</p>
        </div>
        <div className="inline-flex rounded-lg bg-muted/60 p-1 self-start">
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
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                tab === id
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 px-5 pt-4 pb-2 border-b border-border/40">
        {summaryStats.map((stat) => (
          <div key={stat.label}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              {stat.label}
            </p>
            <p className="text-lg font-bold tabular-nums mt-0.5">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="px-2 pb-4 pt-2 h-[240px] sm:h-[260px]">
        {tab === "volume" ? (
          <DailySmsChart data={dailySms} />
        ) : (
          <DeliveryPieChart data={deliveryChart} compact showDetails />
        )}
      </div>
      {tab === "delivery" && deliveryTotal > 0 && (
        <p className="px-5 pb-4 text-[11px] text-muted-foreground">
          {deliveryRate}% delivery rate across {totalMessages.toLocaleString()} total messages.
          Hover slices for counts and percentages.
        </p>
      )}
    </div>
  );
}
