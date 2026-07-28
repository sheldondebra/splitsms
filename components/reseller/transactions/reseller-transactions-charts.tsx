"use client";

import {
  Area,
  AreaChart,
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
import type { ResellerTransactionsDashboard } from "@/lib/reseller/transactions-dashboard";

type Charts = ResellerTransactionsDashboard["charts"];

function EmptyChart({ children }: { children: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed bg-muted/20 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function ResellerTransactionsCharts({
  charts,
  currency,
}: {
  charts: Charts;
  currency: string;
}) {
  const hasDaily = charts.daily.some((d) => d.wallet > 0 || d.commission > 0 || d.count > 0);
  const typeTotal = charts.typeBreakdown.reduce((s, i) => s + i.value, 0);
  const statusTotal = charts.commissionStatus.reduce((s, i) => s + i.value, 0);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 bg-muted/15 px-5 py-4">
          <h2 className="text-sm font-semibold">Ledger activity (30 days)</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Wallet movement and commission earned over time.
          </p>
        </div>
        <div className="p-5">
          {!hasDaily ? (
            <EmptyChart>No ledger activity in the last 30 days.</EmptyChart>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={charts.daily} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="ledgerWalletFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ledgerCommissionFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, fontSize: 12 }}
                  formatter={(value, name) => [
                    `${currency} ${Number(value ?? 0).toFixed(2)}`,
                    name === "wallet" ? "Wallet volume" : "Commission",
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="wallet"
                  name="wallet"
                  stroke="var(--primary)"
                  fill="url(#ledgerWalletFill)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="commission"
                  name="commission"
                  stroke="#22c55e"
                  fill="url(#ledgerCommissionFill)"
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
            <h2 className="text-sm font-semibold">Wallet type mix</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">30-day transaction categories.</p>
          </div>
          <div className="p-4">
            {typeTotal === 0 ? (
              <EmptyChart>No wallet transactions yet.</EmptyChart>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={charts.typeBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={68}
                    paddingAngle={2}
                  >
                    {charts.typeBreakdown.map((entry) => (
                      <Cell key={entry.raw} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="border-b border-border/50 bg-muted/15 px-5 py-4">
            <h2 className="text-sm font-semibold">Commission status</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Paid vs unpaid ledger entries.</p>
          </div>
          <div className="p-4">
            {statusTotal === 0 ? (
              <EmptyChart>No commission entries yet.</EmptyChart>
            ) : (
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={charts.commissionStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={56}
                    paddingAngle={3}
                  >
                    {charts.commissionStatus.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
