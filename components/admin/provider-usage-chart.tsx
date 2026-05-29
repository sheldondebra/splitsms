"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type Slice = {
  label: string;
  count: number;
  fill: string;
  percent: number;
};

export function ProviderUsageChart({
  data,
  total,
}: {
  data: Slice[];
  total: number;
}) {
  if (total === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed bg-muted/30 text-sm text-muted-foreground">
        No provider traffic in the last 30 days yet.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.label,
    value: d.count,
    fill: d.fill,
    percent: d.percent,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_200px]">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={56}
            outerRadius={88}
            paddingAngle={2}
            strokeWidth={0}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 10, fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex flex-col justify-center gap-3 text-sm">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: d.fill }}
            />
            <span className="flex-1 font-medium">{d.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {d.percent}%
            </span>
          </li>
        ))}
        <li className="pt-1 text-xs text-muted-foreground border-t">
          {total.toLocaleString()} messages · last 30 days
        </li>
      </ul>
    </div>
  );
}
