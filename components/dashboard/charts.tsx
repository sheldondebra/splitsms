"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DailyPoint = { date: string; sent?: number; amount?: number };

export function DailySmsChart({ data }: { data: DailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="smsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="sent"
          stroke="var(--primary)"
          fill="url(#smsFill)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SpendingChart({ data }: { data: DailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
        <Bar dataKey="amount" fill="var(--primary)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DeliveryPieChart({
  data,
}: {
  data: { name: string; value: number; fill?: string }[];
}) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-16">No messages yet</p>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={56}
          outerRadius={88}
          paddingAngle={2}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill ?? `hsl(${i * 40}, 70%, 50%)`} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CountryBarChart({
  data,
}: {
  data: { country: string; count: number }[];
}) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-16">No country data yet</p>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="country" width={40} tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
        <Bar dataKey="count" fill="var(--primary)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
