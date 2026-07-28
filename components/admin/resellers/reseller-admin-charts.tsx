"use client";

import Link from "next/link";
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
import { Trophy, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

type Charts = AdminResellersDashboard["charts"];

function EmptyChart({ children }: { children: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed bg-muted/20 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const tone =
    rank === 1
      ? "bg-amber-500/15 text-amber-700 border-amber-500/30"
      : rank === 2
        ? "bg-slate-400/15 text-slate-700 border-slate-400/30"
        : rank === 3
          ? "bg-orange-500/15 text-orange-700 border-orange-500/30"
          : "bg-muted text-muted-foreground border-border/50";
  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-6 items-center justify-center rounded-full border px-1.5 text-[10px] font-bold tabular-nums",
        tone,
      )}
    >
      #{rank}
    </span>
  );
}

export function ResellerAdminCharts({ charts }: { charts: Charts }) {
  const hasDailyActivity = charts.dailyActivity.some((d) => d.sms > 0 || d.commission > 0);
  const hasPartners = charts.topPartners.length > 0;
  const statusTotal = charts.statusBreakdown.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-4">
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
              <h2 className="text-sm font-semibold">Top partners by score</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Composite: commission 40% · SMS 30% · clients 20% · spend 10%.
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
                        name === "score"
                          ? Number(value ?? 0).toFixed(1)
                          : name === "commission"
                            ? `GHS ${Number(value ?? 0).toFixed(2)}`
                            : Number(value ?? 0).toLocaleString(),
                        name === "score" ? "Score" : name === "commission" ? "Commission" : "SMS (30d)",
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="score" name="Score" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="commission" name="Commission" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {hasPartners && (
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border/50 bg-muted/15 px-5 py-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-600" />
            <div>
              <h2 className="text-sm font-semibold">Best performing resellers</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Ranked leaderboard with funds and activity context.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="text-left text-[11px] text-muted-foreground border-b border-border/50">
                  <th className="px-5 py-3 font-medium w-14">Rank</th>
                  <th className="py-3 pr-3 font-medium">Partner</th>
                  <th className="py-3 pr-3 font-medium text-right">Score</th>
                  <th className="py-3 pr-3 font-medium text-right">Commission</th>
                  <th className="py-3 pr-3 font-medium text-right">SMS 30d</th>
                  <th className="py-3 pr-3 font-medium text-right">Clients</th>
                  <th className="py-3 pr-5 font-medium text-right">Funds</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {charts.topPartners.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/20">
                    <td className="px-5 py-3">
                      <RankBadge rank={p.rank} />
                    </td>
                    <td className="py-3 pr-3">
                      <Link
                        href={`/admin/resellers/${p.id}`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {p.name}
                      </Link>
                      {p.badges.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {p.badges.map((badge) => (
                            <span
                              key={badge}
                              className="inline-flex items-center gap-1 rounded-md border border-amber-500/25 bg-amber-500/8 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-200"
                            >
                              <Medal className="h-2.5 w-2.5" />
                              {badge}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-right tabular-nums font-semibold">{p.score.toFixed(1)}</td>
                    <td className="py-3 pr-3 text-right tabular-nums text-muted-foreground">
                      GHS {p.commission.toFixed(2)}
                    </td>
                    <td className="py-3 pr-3 text-right tabular-nums">{p.sms30d.toLocaleString()}</td>
                    <td className="py-3 pr-3 text-right tabular-nums">{p.subUsers}</td>
                    <td className="py-3 pr-5 text-right tabular-nums text-muted-foreground">
                      GHS {(p.ownerWallet + p.clientsWallet).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
