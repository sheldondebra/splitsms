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

function formatShortDate(value: string) {
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function AdminSiteTrafficChart({
  data,
}: {
  data: { date: string; activeUsers: number; sessions: number; newUsers: number }[];
}) {
  if (data.every((d) => d.activeUsers === 0 && d.sessions === 0)) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">No traffic recorded yet in this range.</p>
    );
  }

  const chartData = data.map((d) => ({ ...d, label: formatShortDate(d.date) }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="trafficUsersFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c2410c" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#c2410c" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="trafficSessionsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="activeUsers"
          name="Users"
          stroke="#c2410c"
          fill="url(#trafficUsersFill)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="sessions"
          name="Sessions"
          stroke="#0ea5e9"
          fill="url(#trafficSessionsFill)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
