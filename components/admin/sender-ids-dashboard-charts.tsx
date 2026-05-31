"use client";

import {
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
import type { AdminSenderIdsDashboard } from "@/lib/admin/sender-ids-dashboard";

export function SenderIdsDashboardCharts({
  statusChart,
  providerChart,
  signupChart,
}: Pick<AdminSenderIdsDashboard, "statusChart" | "providerChart" | "signupChart">) {
  const providerBarData = providerChart.flatMap((p) => [
    { provider: p.provider, type: "Approved", count: p.approved, fill: "#22c55e" },
    { provider: p.provider, type: "Pending", count: p.pending, fill: "#f59e0b" },
    { provider: p.provider, type: "Denied", count: p.rejected, fill: "#ef4444" },
  ]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-xl border border-border/60 bg-card p-4 lg:col-span-1">
        <p className="text-sm font-semibold mb-1">Platform status</p>
        <p className="text-xs text-muted-foreground mb-3">SplitSMS approval state</p>
        {statusChart.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">No sender IDs yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusChart}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={2}
              >
                {statusChart.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-4 lg:col-span-1">
        <p className="text-sm font-semibold mb-1">Provider registrations</p>
        <p className="text-xs text-muted-foreground mb-3">mNotify · Twilio · Infobip</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={providerBarData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis dataKey="provider" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {providerBarData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-4 lg:col-span-1">
        <p className="text-sm font-semibold mb-1">Registrations (30d)</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={signupChart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="registrations" name="New" fill="var(--primary)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
