export type AnalyticsPeriod =
  | "today"
  | "yesterday"
  | "7d"
  | "30d"
  | "month"
  | "last_month"
  | "all";

export function resolveAnalyticsRange(
  period: AnalyticsPeriod,
  fromIso?: string,
  toIso?: string,
): { start: Date; end: Date; label: string } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  if (period === "all") {
    return { start: new Date(0), end, label: "All time" };
  }

  if (period === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return { start, end, label: "Today" };
  }

  if (period === "yesterday") {
    const start = new Date();
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    const yEnd = new Date(start);
    yEnd.setHours(23, 59, 59, 999);
    return { start, end: yEnd, label: "Yesterday" };
  }

  if (period === "7d") {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { start, end, label: "Last 7 days" };
  }

  if (period === "30d") {
    const start = new Date();
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return { start, end, label: "Last 30 days" };
  }

  if (period === "month") {
    const start = new Date(end.getFullYear(), end.getMonth(), 1);
    return { start, end, label: "This month" };
  }

  if (period === "last_month") {
    const start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
    const lastEnd = new Date(end.getFullYear(), end.getMonth(), 0, 23, 59, 59, 999);
    return { start, end: lastEnd, label: "Last month" };
  }

  if (fromIso && toIso) {
    const start = new Date(fromIso);
    start.setHours(0, 0, 0, 0);
    const customEnd = new Date(toIso);
    customEnd.setHours(23, 59, 59, 999);
    return { start, end: customEnd, label: "Custom range" };
  }

  const fallback = new Date();
  fallback.setDate(fallback.getDate() - 29);
  fallback.setHours(0, 0, 0, 0);
  return { start: fallback, end, label: "Last 30 days" };
}

export function normalizeTrafficSource(source?: string | null): string {
  const s = (source ?? "direct").toLowerCase();
  if (s === "qr") return "QR code";
  if (s === "shortlink" || s === "copy") return "Short link";
  if (s === "iframe" || s === "script") return "Website iframe";
  if (s === "wordpress" || s === "wordpress_shortcode") return "WordPress embed";
  if (s === "whatsapp") return "WhatsApp";
  if (s === "facebook") return "Facebook";
  if (s === "email") return "Email";
  if (s === "instagram") return "Instagram";
  if (s === "sms") return "SMS";
  if (s === "public" || s === "direct") return "Direct";
  if (s === "respondent" || s === "admin") return "Automation";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatChartDay(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function buildDaySeries(
  start: Date,
  end: Date,
): string[] {
  const days: string[] = [];
  const cursor = new Date(start);
  cursor.setHours(12, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setHours(12, 0, 0, 0);

  while (cursor <= endDay) {
    days.push(dayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}
