"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ResellerWalletDashboard } from "@/lib/reseller/wallet-dashboard";

type Charts = ResellerWalletDashboard["charts"];

function EmptyChart({ children }: { children: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed bg-muted/20 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function ResellerWalletCharts({
  charts,
  currency,
}: {
  charts: Charts;
  currency: string;
}) {
  const hasFlow = charts.fundingByDay.some((d) => d.funded > 0 || d.commission > 0);
  const hasClients = charts.fundingByClient.length > 0;

  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 bg-muted/15 px-5 py-4">
          <h2 className="text-sm font-semibold">Cash flow (30 days)</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Client funding outflows vs commission earned.
          </p>
        </div>
        <div className="p-5">
          {!hasFlow ? (
            <EmptyChart>No funding or commission activity yet.</EmptyChart>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={charts.fundingByDay} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="walletFundedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="walletCommissionFill" x1="0" y1="0" x2="0" y2="1">
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
                    name === "funded" ? "Funded to clients" : "Commission",
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="funded"
                  name="funded"
                  stroke="var(--primary)"
                  fill="url(#walletFundedFill)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="commission"
                  name="commission"
                  stroke="#22c55e"
                  fill="url(#walletCommissionFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 bg-muted/15 px-5 py-4">
          <h2 className="text-sm font-semibold">Funding by client (30d)</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Who received the most wallet / credit allocation.
          </p>
        </div>
        <div className="p-5">
          {!hasClients ? (
            <EmptyChart>Fund a client to see allocation charts.</EmptyChart>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={charts.fundingByClient}
                layout="vertical"
                margin={{ top: 8, right: 12, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, fontSize: 12 }}
                  formatter={(value) => [`${currency} ${Number(value ?? 0).toFixed(2)}`, "Funded"]}
                />
                <Bar dataKey="amount" fill="var(--primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
