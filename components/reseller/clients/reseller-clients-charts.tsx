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
import type { ResellerClientsDashboard } from "@/lib/reseller/clients";

type Charts = ResellerClientsDashboard["charts"];

function EmptyChart({ children }: { children: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed bg-muted/20 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function ResellerClientsCharts({ charts }: { charts: Charts }) {
  const hasDaily = charts.daily30.some((d) => d.sms > 0);
  const statusTotal = charts.statusBreakdown.reduce((sum, item) => sum + item.value, 0);
  const hasTop = charts.topClients.some((c) => c.messages > 0);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_0.85fr]">
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 bg-muted/15 px-5 py-4">
          <h2 className="text-sm font-semibold">Client SMS volume (30 days)</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Aggregate traffic across all clients under your reseller account.
          </p>
        </div>
        <div className="p-5">
          {!hasDaily ? (
            <EmptyChart>No client SMS activity in the last 30 days.</EmptyChart>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={charts.daily30} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="clientSmsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="sms"
                  name="Messages"
                  stroke="var(--primary)"
                  fill="url(#clientSmsFill)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  name="Failed"
                  stroke="#ef4444"
                  fill="transparent"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="border-b border-border/50 bg-muted/15 px-5 py-4">
            <h2 className="text-sm font-semibold">Delivery mix (30d)</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Status breakdown for client traffic.</p>
          </div>
          <div className="p-5">
            {statusTotal === 0 ? (
              <EmptyChart>No delivery data yet.</EmptyChart>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={charts.statusBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={2}
                  >
                    {charts.statusBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card shadow-sm xl:col-span-2">
        <div className="border-b border-border/50 bg-muted/15 px-5 py-4">
          <h2 className="text-sm font-semibold">Top clients by SMS</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Highest lifetime message volume.</p>
        </div>
        <div className="p-5">
          {!hasTop ? (
            <EmptyChart>Create clients and start sending to see rankings.</EmptyChart>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={charts.topClients}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="messages" name="Messages" fill="var(--primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
