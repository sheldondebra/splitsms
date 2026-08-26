export type ReportPeriodDays = 7 | 30 | 90;

export const REPORT_PERIOD_OPTIONS: ReportPeriodDays[] = [7, 30, 90];

export function parseReportPeriod(raw?: string): ReportPeriodDays {
  const n = Number(raw);
  if (n === 7 || n === 30 || n === 90) return n;
  return 30;
}

export function daysAgo(n: number, now = new Date()) {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export type ReportSnapshotWindow = "daily" | "weekly" | "monthly";

export type ReportSnapshotKind = "delivery" | "members" | "transactions";

export function reportSnapshotWindows(now = new Date()) {
  const daily = new Date(now);
  daily.setHours(0, 0, 0, 0);
  return {
    daily,
    weekly: daysAgo(7, now),
    monthly: daysAgo(30, now),
  };
}

export function reportSnapshotDetailHref(
  kind: ReportSnapshotKind,
  window: ReportSnapshotWindow,
) {
  const days = window === "monthly" ? 30 : 7;
  return `/admin/reports/${kind}?days=${days}`;
}

export function dayLabels(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (count - 1 - i));
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    return {
      label: d.toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
      start,
    };
  });
}

export function countByDay<T extends { createdAt: Date }>(
  items: T[],
  days: ReturnType<typeof dayLabels>,
) {
  return days.map(({ label, start }) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const value = items.filter((x) => x.createdAt >= start && x.createdAt < end).length;
    return { date: label, value };
  });
}

function localDayKey(value: Date | string) {
  if (typeof value === "string") return value.slice(0, 10);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Map SQL day buckets onto a complete label series. Missing days are 0. */
export function mergeDayCounts(
  days: { label: string; start: Date }[],
  rows: { day: Date | string; count: number | bigint }[],
) {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = localDayKey(row.day);
    map.set(key, (map.get(key) ?? 0) + Number(row.count));
  }
  return days.map(({ label, start }) => ({
    date: label,
    value: map.get(localDayKey(start)) ?? 0,
  }));
}

export function sumByDay<T extends { createdAt: Date }>(
  items: T[],
  days: ReturnType<typeof dayLabels>,
  getValue: (item: T) => number,
) {
  return days.map(({ label, start }) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const value = items
      .filter((x) => x.createdAt >= start && x.createdAt < end)
      .reduce((s, x) => s + getValue(x), 0);
    return { date: label, value: Math.round(value * 100) / 100 };
  });
}
