"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type Slice = {
  label: string;
  key: string;
  count: number;
  fill: string;
  percent: number;
};

export function MembersSourceChart({ data, total }: { data: Slice[]; total: number }) {
  if (total === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed bg-muted/20 text-sm text-muted-foreground">
        No members yet.
      </div>
    );
  }

  const chartData = data.filter((d) => d.count > 0).map((d) => ({
    name: d.label,
    value: d.count,
    fill: d.fill,
    percent: d.percent,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
        No source data.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={78}
            paddingAngle={2}
            strokeWidth={0}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex flex-col justify-center gap-2.5 text-sm">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: d.fill }}
            />
            <span className="flex-1 text-xs font-medium leading-tight">{d.label}</span>
            <span className="tabular-nums text-xs text-muted-foreground">
              {d.count} · {d.percent}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
