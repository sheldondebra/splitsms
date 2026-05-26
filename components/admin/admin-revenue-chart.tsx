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
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ borderRadius: 8, fontSize: 12 }}
          formatter={(value, name) => [
            `GHS ${Number(value ?? 0).toFixed(2)}`,
            name === "deposits" ? "Deposits" : "SMS spend",
          ]}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="deposits" name="Deposits" fill="#22c55e" radius={[3, 3, 0, 0]} />
        <Bar dataKey="smsRevenue" name="SMS spend" fill="var(--primary)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
