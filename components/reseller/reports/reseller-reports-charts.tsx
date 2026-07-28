"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ResellerReportsDashboard } from "@/lib/reseller/reports-dashboard";

type Charts = ResellerReportsDashboard["charts"];

function EmptyChart({ children }: { children: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed bg-muted/20 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="border-b border-border/50 bg-muted/15 px-5 py-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function ResellerReportsCharts({
  charts,
  currency,
}: {
  charts: Charts;
  currency: string;
}) {
  const hasDaily = charts.dailyPerformance.some(
    (d) => d.sms > 0 || d.commission > 0 || d.funded > 0,
  );
  const deliveryTotal = charts.deliveryMix.reduce((s, i) => s + i.value, 0);
  const hasUsers = charts.deliveryByUserChart.length > 0;
  const hasTopups = charts.topupByUserChart.length > 0;
  const hasProviders = charts.providerMix.length > 0;

  return (
    <div className="space-y-4">
      <ChartCard
        title="Business performance"
        description="Daily SMS volume, successful deliveries, and commission earned."
      >
        {!hasDaily ? (
          <EmptyChart>No performance data in this period.</EmptyChart>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart
              data={charts.dailyPerformance}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="reportSmsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis yAxisId="sms" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="money" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: 10, fontSize: 12 }}
                formatter={(value, name) => {
                  const n = Number(value ?? 0);
                  if (name === "commission" || name === "funded") {
                    return [`${currency} ${n.toFixed(2)}`, name === "commission" ? "Commission" : "Funded"];
                  }
                  const labels: Record<string, string> = {
                    sms: "SMS",
                    delivered: "Delivered",
                    failed: "Failed",
                  };
                  return [n.toLocaleString(), labels[String(name)] ?? String(name)];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area
                yAxisId="sms"
                type="monotone"
                dataKey="sms"
                name="sms"
                stroke="var(--primary)"
                fill="url(#reportSmsFill)"
                strokeWidth={2}
              />
              <Bar yAxisId="sms" dataKey="delivered" name="delivered" fill="#22c55e" radius={[2, 2, 0, 0]} />
              <Bar yAxisId="sms" dataKey="failed" name="failed" fill="#ef4444" radius={[2, 2, 0, 0]} />
              <Line
                yAxisId="money"
                type="monotone"
                dataKey="commission"
                name="commission"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="SMS delivery by users"
          description="Top clients by delivered vs failed messages."
        >
          {!hasUsers ? (
            <EmptyChart>No client SMS traffic yet.</EmptyChart>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={charts.deliveryByUserChart}
                layout="vertical"
                margin={{ top: 8, right: 12, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, fontSize: 12 }}
                  labelFormatter={(_, payload) =>
                    String(payload?.[0]?.payload?.fullName ?? "")
                  }
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="delivered" name="Delivered" stackId="a" fill="#22c55e" />
                <Bar dataKey="failed" name="Failed" stackId="a" fill="#ef4444" />
                <Bar dataKey="pending" name="Pending" stackId="a" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Top-up by user"
          description="Wallet and credit funding allocated to each client."
        >
          {!hasTopups ? (
            <EmptyChart>No client top-ups in this period.</EmptyChart>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={charts.topupByUserChart}
                layout="vertical"
                margin={{ top: 8, right: 12, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, fontSize: 12 }}
                  formatter={(value, name) => [
                    name === "credits"
                      ? Number(value ?? 0).toLocaleString()
                      : `${currency} ${Number(value ?? 0).toFixed(2)}`,
                    name === "credits" ? "Credits" : "Amount funded",
                  ]}
                  labelFormatter={(_, payload) =>
                    String(payload?.[0]?.payload?.fullName ?? "")
                  }
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="amount" name="amount" fill="var(--primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1.1fr]">
        <ChartCard title="Delivery mix" description="Message status breakdown.">
          {deliveryTotal === 0 ? (
            <EmptyChart>No delivery data.</EmptyChart>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={charts.deliveryMix}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={74}
                  paddingAngle={2}
                >
                  {charts.deliveryMix.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Provider mix" description="Traffic by SMS gateway.">
          {!hasProviders ? (
            <EmptyChart>No provider traffic yet.</EmptyChart>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={charts.providerMix}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={74}
                  paddingAngle={2}
                >
                  {charts.providerMix.map((entry, i) => (
                    <Cell
                      key={entry.name}
                      fill={["#f97316", "#0ea5e9", "#22c55e", "#a855f7", "#64748b"][i % 5]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Funding vs commission"
          description="Daily money out to clients vs margins earned."
        >
          {!hasDaily ? (
            <EmptyChart>No money movement yet.</EmptyChart>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={charts.dailyPerformance}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="reportFundFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="reportCommFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, fontSize: 12 }}
                  formatter={(value, name) => [
                    `${currency} ${Number(value ?? 0).toFixed(2)}`,
                    name === "funded" ? "Funded" : "Commission",
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Area
                  type="monotone"
                  dataKey="funded"
                  name="funded"
                  stroke="var(--primary)"
                  fill="url(#reportFundFill)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="commission"
                  name="commission"
                  stroke="#22c55e"
                  fill="url(#reportCommFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
