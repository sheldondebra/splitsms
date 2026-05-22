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
};

export function DashboardChartsPanel({
  dailySms,
  deliveryChart,
  messagesToday,
  deliveryRate,
}: DashboardChartsPanelProps) {
  const [tab, setTab] = useState<ChartTab>("volume");
  const total14d = dailySms.reduce((n, d) => n + (d.sent ?? 0), 0);

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
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 px-5 pt-4 pb-2 border-b border-border/40">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Today
          </p>
          <p className="text-lg font-bold tabular-nums mt-0.5">{messagesToday}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            14 days
          </p>
          <p className="text-lg font-bold tabular-nums mt-0.5">{total14d}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Delivered
          </p>
          <p className="text-lg font-bold tabular-nums mt-0.5">{deliveryRate}%</p>
        </div>
      </div>

      <div className="px-2 pb-4 pt-2 h-[240px] sm:h-[260px]">
        {tab === "volume" ? (
          <DailySmsChart data={dailySms} />
        ) : (
          <DeliveryPieChart data={deliveryChart} compact />
        )}
      </div>
    </div>
  );
}
