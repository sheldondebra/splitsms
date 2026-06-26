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

type DeliverySlice = { name: string; value: number; fill?: string };

function ChartTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; payload?: DeliverySlice }[];
  total: number;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;

  return (
    <div className="rounded-lg border border-border/60 bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-semibold">{item.name}</p>
      <p className="text-muted-foreground mt-0.5">
        {item.value.toLocaleString()} messages · {pct}%
      </p>
    </div>
  );
}

function DeliveryBreakdownList({
  data,
  total,
}: {
  data: DeliverySlice[];
  total: number;
}) {
  return (
    <ul className="flex flex-col justify-center gap-2.5 min-w-[132px]">
      {data.map((item) => {
        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return (
          <li key={item.name} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: item.fill ?? "var(--primary)" }}
            />
            <span className="flex-1 truncate text-muted-foreground">{item.name}</span>
            <span className="font-semibold tabular-nums">{item.value.toLocaleString()}</span>
            <span className="w-8 text-right text-muted-foreground tabular-nums">{pct}%</span>
          </li>
        );
      })}
    </ul>
  );
}

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
  compact,
  showDetails,
}: {
  data: DeliverySlice[];
  compact?: boolean;
  showDetails?: boolean;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-16">No messages yet</p>
    );
  }

  const chart = (
    <div className="relative w-full h-full">
      <ResponsiveContainer width="100%" height={compact && showDetails ? "100%" : compact ? 220 : 260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={compact ? (showDetails ? 52 : 48) : 56}
            outerRadius={compact ? (showDetails ? 76 : 72) : 88}
            paddingAngle={2}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill ?? `hsl(${i * 40}, 70%, 50%)`} />
            ))}
          </Pie>
          <Tooltip
            content={(props) => (
              <ChartTooltip
                active={props.active}
                payload={
                  props.payload as unknown as {
                    name?: string;
                    value?: number;
                    payload?: DeliverySlice;
                  }[]
                }
                total={total}
              />
            )}
          />
          {!compact && <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />}
        </PieChart>
      </ResponsiveContainer>
      {(compact && showDetails) || !compact ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xl font-bold tabular-nums leading-none">{total.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground mt-1">total</p>
        </div>
      ) : null}
    </div>
  );

  if (compact && showDetails) {
    return (
      <div className="flex h-full flex-col sm:flex-row items-center gap-4 px-2 py-1">
        <div className="relative min-w-0 w-full sm:flex-1 h-[180px] sm:h-[220px]">{chart}</div>
        <DeliveryBreakdownList data={data} total={total} />
      </div>
    );
  }

  return chart;
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
