"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function AdminWordPressVersionChart({
  data,
  latestVersion,
}: {
  data: { version: string; count: number }[];
  latestVersion: string;
}) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">No sites connected yet.</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
        <XAxis dataKey="version" tick={{ fontSize: 11 }} tickFormatter={(v) => `v${v}`} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
          {data.map((d) => (
            <Cell key={d.version} fill={d.version === latestVersion ? "#22c55e" : "#f59e0b"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
