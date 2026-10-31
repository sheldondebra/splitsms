"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function AdminWordPressLeadsChart({
  data,
}: {
  data: { date: string; leads: number }[];
}) {
  if (data.every((d) => d.leads === 0)) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">No downloads in this period.</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="leadsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={24} />
        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="leads"
          stroke="#0ea5e9"
          fill="url(#leadsFill)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
