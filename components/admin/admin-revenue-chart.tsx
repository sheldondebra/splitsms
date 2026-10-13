"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const SERIES = [
  { key: "deposits", label: "Deposits", color: "#16a34a" },
  { key: "smsRevenue", label: "SMS spend", color: "var(--primary)" },
] as const;

function money(value: unknown) {
  return `GHS ${Number(value ?? 0).toFixed(2)}`;
}

function RevenueTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: ReadonlyArray<{ dataKey?: unknown; value?: unknown }>;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border/70 bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-semibold text-foreground">{label}</p>
      <div className="space-y-1">
        {SERIES.map((series) => {
          const item = payload.find((entry) => entry.dataKey === series.key);
          return (
            <p key={series.key} className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: series.color }}
                />
                {series.label}
              </span>
              <span className="font-medium tabular-nums text-foreground">
                {money(item?.value)}
              </span>
            </p>
          );
        })}
      </div>
    </div>
  );
}

export function AdminRevenueChart({
  data,
}: {
  data: { date: string; deposits: number; smsRevenue: number }[];
}) {
  if (data.every((d) => d.deposits === 0 && d.smsRevenue === 0)) {
    return (
      <p className="text-sm text-muted-foreground text-center py-16">
        No revenue activity in this period.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          minTickGap={36}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          width={36}
          tickFormatter={(value) => Number(value).toLocaleString()}
        />
        <Tooltip
          content={<RevenueTooltip />}
          cursor={{ fill: "var(--muted)", opacity: 0.45 }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(value) => <span className="text-muted-foreground">{value}</span>}
        />
        {SERIES.map((series) => (
          <Bar
            key={series.key}
            dataKey={series.key}
            name={series.label}
            fill={series.color}
            radius={[3, 3, 0, 0]}
            maxBarSize={16}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
