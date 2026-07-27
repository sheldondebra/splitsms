"use client";

import type { AdminResellersDashboard } from "@/lib/admin/resellers-dashboard";
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

type Charts = AdminResellersDashboard["charts"];

function EmptyChart({ children }: { children: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed bg-muted/20 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function ResellerAdminCharts({ charts }: { charts: Charts }) {
  const hasDailyActivity = charts.dailyActivity.some((d) => d.sms > 0 || d.commission > 0);
  const hasPartners = charts.topPartners.length > 0;
  const statusTotal = charts.statusBreakdown.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.8fr]">
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 bg-muted/15 px-5 py-4">
          <h2 className="text-sm font-semibold">30-day reseller activity</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            SMS volume from reseller clients against earned commission.
          </p>
        </div>
        <div className="p-5">
          {!hasDailyActivity ? (
            <EmptyChart>No reseller SMS or commission activity in this period.</EmptyChart>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={charts.dailyActivity} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="resellerSmsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="resellerCommissionFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis yAxisId="sms" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="commission" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, fontSize: 12 }}
                  formatter={(value, name) => [
                    name === "commission"
                      ? `GHS ${Number(value ?? 0).toFixed(2)}`
                      : Number(value ?? 0).toLocaleString(),
                    name === "commission" ? "Commission" : "SMS units",
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area
                  yAxisId="sms"
                  type="monotone"
                  dataKey="sms"
                  name="SMS units"
                  stroke="var(--primary)"
                  fill="url(#resellerSmsFill)"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="commission"
                  type="monotone"
                  dataKey="commission"
                  name="Commission"
                  stroke="#22c55e"
                  fill="url(#resellerCommissionFill)"
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
            <h2 className="text-sm font-semibold">Account status mix</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Live, pending, suspended, and rejected partners.
            </p>
          </div>
          <div className="p-5">
            {statusTotal === 0 ? (
              <EmptyChart>No reseller accounts yet.</EmptyChart>
            ) : (
              <div className="grid gap-3 sm:grid-cols-[1fr_160px] xl:grid-cols-1 2xl:grid-cols-[1fr_160px]">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={charts.statusBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={54}
                      outerRadius={82}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {charts.statusBreakdown.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="flex flex-col justify-center gap-2 text-xs">
                  {charts.statusBreakdown.map((item) => (
                    <li key={item.name} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="flex-1 text-muted-foreground">{item.name}</span>
                      <span className="font-semibold tabular-nums">{item.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="border-b border-border/50 bg-muted/15 px-5 py-4">
            <h2 className="text-sm font-semibold">Top earning partners</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Ranked by all-time commission, with 30-day SMS context.
            </p>
          </div>
          <div className="p-5">
            {!hasPartners ? (
              <EmptyChart>No partner rankings yet.</EmptyChart>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={charts.topPartners}
                  layout="vertical"
                  margin={{ top: 8, right: 12, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={92}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => String(value).slice(0, 16)}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, fontSize: 12 }}
                    formatter={(value, name) => [
                      name === "commission"
                        ? `GHS ${Number(value ?? 0).toFixed(2)}`
                        : Number(value ?? 0).toLocaleString(),
                      name === "commission" ? "Commission" : "SMS (30d)",
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="commission" name="Commission" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="sms30d" name="SMS (30d)" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
