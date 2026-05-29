"use client";

import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DeliveryPieChart } from "@/components/dashboard/charts";
import type { AdminMemberDetail } from "@/lib/admin/member-detail";

export function MemberUsageCharts({
  usageChart,
  statusChart,
}: {
  usageChart: AdminMemberDetail["analytics"]["usageChart"];
  statusChart: AdminMemberDetail["analytics"]["statusChart"];
}) {
  const hasSms = usageChart.some((d) => d.sent > 0);

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="lg:col-span-3 rounded-xl border border-border/60 bg-card p-4">
        <p className="text-sm font-semibold mb-1">SMS volume (30 days)</p>
        <p className="text-xs text-muted-foreground mb-3">Messages sent and credits used per day</p>
        {!hasSms ? (
          <p className="text-sm text-muted-foreground text-center py-16">No SMS in the last 30 days.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={usageChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="memberSmsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area
                type="monotone"
                dataKey="sent"
                name="Messages"
                stroke="#8b5cf6"
                fill="url(#memberSmsFill)"
                strokeWidth={2}
              />
              <Bar dataKey="failed" name="Failed" fill="#ef4444" opacity={0.75} radius={[2, 2, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="lg:col-span-2 rounded-xl border border-border/60 bg-card p-4">
        <p className="text-sm font-semibold mb-1">Delivery status</p>
        <p className="text-xs text-muted-foreground mb-2">All-time message breakdown</p>
        <DeliveryPieChart data={statusChart} compact />
      </div>

      <div className="lg:col-span-5 rounded-xl border border-border/60 bg-card p-4">
        <p className="text-sm font-semibold mb-1">Credits used (30 days)</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={usageChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="creditsUsed" name="Credits" fill="var(--primary)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
