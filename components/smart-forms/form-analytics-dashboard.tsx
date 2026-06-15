"use client";

import { useRouter, usePathname } from "next/navigation";
import { useMemo } from "react";
import type { FormAnalyticsData } from "@/lib/smart-forms/analytics";
import type { AnalyticsPeriod } from "@/lib/smart-forms/analytics-range";
import { AppCard, AppCardBody } from "@/components/dashboard/page-shell";
import { DeliveryPieChart } from "@/components/dashboard/charts";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Eye,
  Users,
  Link2,
  QrCode,
  Send,
  Share2,
  UserPlus,
  MessageSquare,
  Download,
  Percent,
  Calendar,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "all", label: "All time" },
];

function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
}) {
  return (
    <AppCard>
      <AppCardBody className="p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <Icon className="h-4 w-4 text-primary shrink-0" />
        </div>
        <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </AppCardBody>
    </AppCard>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <AppCard>
      <AppCardBody className="p-4 sm:p-5">
        <h2 className="font-semibold mb-4">{title}</h2>
        {children}
      </AppCardBody>
    </AppCard>
  );
}

function EmptyChart() {
  return <p className="text-sm text-muted-foreground text-center py-12">No data for this period.</p>;
}

export function FormAnalyticsDashboard({ data }: { data: FormAnalyticsData }) {
  const router = useRouter();
  const pathname = usePathname();

  const lastSubmission = data.metrics.lastSubmissionAt
    ? new Date(data.metrics.lastSubmissionAt).toLocaleString()
    : "—";

  const hasTimeSeries = useMemo(
    () => data.timeSeries.some((d) => d.views > 0 || d.submissions > 0),
    [data.timeSeries],
  );

  function updateFilters(period: string, source: string) {
    const params = new URLSearchParams();
    if (period && period !== "30d") params.set("period", period);
    if (source) params.set("source", source);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const pieColors = ["#0f172a", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

  const sourcePie = data.sourceBreakdown.map((item, i) => ({
    ...item,
    fill: pieColors[i % pieColors.length],
  }));

  const sharePie = data.shareBreakdown.map((item, i) => ({
    ...item,
    fill: pieColors[(i + 2) % pieColors.length],
  }));

  const devicePie = data.deviceBreakdown.map((item, i) => ({
    ...item,
    fill: pieColors[(i + 1) % pieColors.length],
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <strong className="text-foreground">{data.periodLabel}</strong> for {data.formName}
        </p>
        <div className="flex flex-wrap gap-2">
          <select
            value={data.period}
            onChange={(e) => updateFilters(e.target.value, data.sourceFilter)}
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <select
            value={data.sourceFilter}
            onChange={(e) => updateFilters(data.period, e.target.value)}
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          >
            {data.availableSources.map((s) => (
              <option key={s || "all"} value={s}>
                {s ? s : "All sources"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total views" value={data.metrics.views} icon={Eye} />
        <MetricCard label="Unique views" value={data.metrics.uniqueViews} icon={Users} />
        <MetricCard label="Submissions" value={data.metrics.submissions} icon={Send} />
        <MetricCard
          label="Conversion rate"
          value={`${data.metrics.conversionRate}%`}
          icon={Percent}
        />
        <MetricCard label="Short link clicks" value={data.metrics.shortlinkClicks} icon={Link2} />
        <MetricCard label="QR scans" value={data.metrics.qrScans} icon={QrCode} />
        <MetricCard label="Shares" value={data.metrics.shares} icon={Share2} />
        <MetricCard label="Opens (embed)" value={data.metrics.opens} icon={Eye} />
        <MetricCard label="Contacts saved" value={data.metrics.contactsCollected} icon={UserPlus} />
        <MetricCard label="SMS sent" value={data.metrics.smsSent} icon={MessageSquare} />
        <MetricCard label="SMS failed" value={data.metrics.smsFailed} icon={MessageSquare} />
        <MetricCard label="Exports" value={data.metrics.exports} icon={Download} />
        <MetricCard label="Last submission" value={lastSubmission} icon={Calendar} hint="Most recent" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Views & submissions over time">
          {hasTimeSeries ? (
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={data.timeSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="views"
                  name="Views"
                  stroke="var(--primary)"
                  fill="var(--primary)"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Bar
                  yAxisId="right"
                  dataKey="submissions"
                  name="Submissions"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard title="Conversion rate over time">
          {hasTimeSeries ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.timeSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="conversionRate"
                  name="Conversion %"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard title="QR scans over time">
          {hasTimeSeries ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.timeSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="qrScans" name="QR scans" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard title="Contact growth over time">
          {hasTimeSeries ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.timeSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="contacts"
                  name="Contacts saved"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Traffic source breakdown">
          <DeliveryPieChart data={sourcePie} compact />
        </ChartCard>
        <ChartCard title="Shares by platform">
          <DeliveryPieChart data={sharePie} compact />
        </ChartCard>
        <ChartCard title="Device breakdown">
          <DeliveryPieChart data={devicePie} compact />
        </ChartCard>
        <ChartCard title="SMS automation status">
          <DeliveryPieChart
            data={data.smsBreakdown.map((item, i) => ({
              ...item,
              fill: pieColors[i % pieColors.length],
            }))}
            compact
          />
        </ChartCard>
      </div>

      <ChartCard title="Response contact status">
        {data.responseStatusBreakdown.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.responseStatusBreakdown} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" name="Responses" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </ChartCard>
    </div>
  );
}
