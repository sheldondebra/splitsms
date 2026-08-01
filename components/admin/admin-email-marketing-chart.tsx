"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function AdminEmailMarketingChart({
  data,
}: {
  data: { date: string; sent: number; failed: number }[];
}) {
  if (data.every((d) => d.sent === 0 && d.failed === 0)) {
    return (
      <p className="text-sm text-muted-foreground text-center py-16">
        No campaign sends in the last 14 days.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="emSentFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c2410c" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#c2410c" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="emFailFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dc2626" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="sent"
          name="Sent"
          stroke="#c2410c"
          fill="url(#emSentFill)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="failed"
          name="Failed"
          stroke="#dc2626"
          fill="url(#emFailFill)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
