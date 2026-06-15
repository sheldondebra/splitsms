import { prisma } from "@/lib/db";
import { parseDeviceType, deviceLabel, type DeviceType } from "@/lib/smart-forms/device";
import {
  type AnalyticsPeriod,
  resolveAnalyticsRange,
  normalizeTrafficSource,
  dayKey,
  formatChartDay,
  buildDaySeries,
} from "@/lib/smart-forms/analytics-range";
import type { SmartFormAnalyticsEventType } from "@/lib/generated/prisma/client";

export type FormAnalyticsFilters = {
  period?: AnalyticsPeriod;
  from?: string;
  to?: string;
  source?: string;
};

export type FormAnalyticsData = {
  formName: string;
  periodLabel: string;
  period: AnalyticsPeriod;
  sourceFilter: string;
  metrics: {
    views: number;
    uniqueViews: number;
    shortlinkClicks: number;
    opens: number;
    shares: number;
    qrScans: number;
    submissions: number;
    conversionRate: number;
    contactsCollected: number;
    smsSent: number;
    smsFailed: number;
    exports: number;
    lastSubmissionAt: string | null;
  };
  timeSeries: {
    date: string;
    label: string;
    views: number;
    submissions: number;
    conversionRate: number;
    qrScans: number;
    contacts: number;
  }[];
  sourceBreakdown: { name: string; value: number }[];
  shareBreakdown: { name: string; value: number }[];
  deviceBreakdown: { name: string; value: number }[];
  smsBreakdown: { name: string; value: number }[];
  responseStatusBreakdown: { name: string; value: number }[];
  availableSources: string[];
};

function countByType(events: { eventType: SmartFormAnalyticsEventType }[], type: SmartFormAnalyticsEventType) {
  return events.filter((e) => e.eventType === type).length;
}

function incrementMap(map: Map<string, number>, key: string, by = 1) {
  map.set(key, (map.get(key) ?? 0) + by);
}

export async function getSmartFormAnalytics(
  userId: string,
  formId: string,
  filters: FormAnalyticsFilters = {},
): Promise<FormAnalyticsData | null> {
  const period = (filters.period ?? "30d") as AnalyticsPeriod;
  const { start, end, label } = resolveAnalyticsRange(period, filters.from, filters.to);

  const form = await prisma.smartForm.findFirst({
    where: { id: formId, userId },
    select: { name: true },
  });
  if (!form) return null;

  const sourceFilter = filters.source?.trim() || "";

  const eventWhere = {
    formId,
    userId,
    createdAt: { gte: start, lte: end },
    ...(sourceFilter ? { source: sourceFilter } : {}),
  };

  const [events, responses, lastSubmission] = await Promise.all([
    prisma.smartFormAnalyticsEvent.findMany({
      where: eventWhere,
      select: {
        eventType: true,
        source: true,
        createdAt: true,
        ipHash: true,
        userAgent: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.smartFormResponse.findMany({
      where: {
        formId,
        userId,
        submittedAt: { gte: start, lte: end },
        ...(sourceFilter ? { source: sourceFilter } : {}),
      },
      select: {
        submittedAt: true,
        contactSaveStatus: true,
        smsStatus: true,
        source: true,
      },
    }),
    prisma.smartFormResponse.findFirst({
      where: { formId, userId },
      orderBy: { submittedAt: "desc" },
      select: { submittedAt: true },
    }),
  ]);

  const viewEvents = events.filter((e) => e.eventType === "VIEW");
  const uniqueIp = new Set(viewEvents.map((e) => e.ipHash).filter(Boolean));

  const views = viewEvents.length;
  const submissions = responses.length;
  const conversionRate = views > 0 ? Math.round((submissions / views) * 1000) / 10 : 0;

  const metrics = {
    views,
    uniqueViews: uniqueIp.size,
    shortlinkClicks: events.filter(
      (e) =>
        e.eventType === "SHORTLINK_CLICK" ||
        (e.eventType === "VIEW" && ["shortlink", "copy"].includes((e.source ?? "").toLowerCase())),
    ).length,
    opens: countByType(events, "OPEN") + countByType(events, "EMBED_LOAD") + countByType(events, "WORDPRESS_LOAD"),
    shares: countByType(events, "SHARE"),
    qrScans: countByType(events, "QR_SCAN"),
    submissions,
    conversionRate,
    contactsCollected: countByType(events, "CONTACT_SAVED"),
    smsSent: countByType(events, "SMS_SENT"),
    smsFailed: countByType(events, "SMS_FAILED"),
    exports: countByType(events, "EXPORT"),
    lastSubmissionAt: lastSubmission?.submittedAt.toISOString() ?? null,
  };

  const days = buildDaySeries(start, end);
  const viewsByDay = new Map<string, number>();
  const submitsByDay = new Map<string, number>();
  const qrByDay = new Map<string, number>();
  const contactsByDay = new Map<string, number>();

  for (const day of days) {
    viewsByDay.set(day, 0);
    submitsByDay.set(day, 0);
    qrByDay.set(day, 0);
    contactsByDay.set(day, 0);
  }

  for (const e of viewEvents) {
    incrementMap(viewsByDay, dayKey(e.createdAt));
  }
  for (const e of events.filter((x) => x.eventType === "QR_SCAN")) {
    incrementMap(qrByDay, dayKey(e.createdAt));
  }
  for (const e of events.filter((x) => x.eventType === "CONTACT_SAVED")) {
    incrementMap(contactsByDay, dayKey(e.createdAt));
  }
  for (const r of responses) {
    incrementMap(submitsByDay, dayKey(r.submittedAt));
  }

  const timeSeries = days.map((date) => {
    const v = viewsByDay.get(date) ?? 0;
    const s = submitsByDay.get(date) ?? 0;
    return {
      date,
      label: formatChartDay(date),
      views: v,
      submissions: s,
      conversionRate: v > 0 ? Math.round((s / v) * 1000) / 10 : 0,
      qrScans: qrByDay.get(date) ?? 0,
      contacts: contactsByDay.get(date) ?? 0,
    };
  });

  const sourceMap = new Map<string, number>();
  for (const e of events) {
    if (["VIEW", "OPEN", "QR_SCAN", "EMBED_LOAD", "WORDPRESS_LOAD", "SHORTLINK_CLICK"].includes(e.eventType)) {
      incrementMap(sourceMap, normalizeTrafficSource(e.source));
    }
  }
  for (const r of responses) {
    incrementMap(sourceMap, normalizeTrafficSource(r.source));
  }

  const shareMap = new Map<string, number>();
  for (const e of events.filter((x) => x.eventType === "SHARE")) {
    const platform = (e.source ?? "share").charAt(0).toUpperCase() + (e.source ?? "share").slice(1);
    incrementMap(shareMap, platform);
  }

  const deviceMap = new Map<DeviceType, number>();
  for (const e of viewEvents) {
    const device = parseDeviceType(e.userAgent);
    deviceMap.set(device, (deviceMap.get(device) ?? 0) + 1);
  }

  const smsMap = new Map<string, number>();
  for (const r of responses) {
    if (r.smsStatus === "SENT") incrementMap(smsMap, "Sent");
    else if (r.smsStatus === "FAILED") incrementMap(smsMap, "Failed");
    else if (r.smsStatus === "QUEUED") incrementMap(smsMap, "Pending");
    else incrementMap(smsMap, "None");
  }

  const responseStatusMap = new Map<string, number>();
  for (const r of responses) {
    const key =
      r.contactSaveStatus === "SAVED"
        ? "Contact saved"
        : r.contactSaveStatus === "FAILED"
          ? "Contact failed"
          : r.contactSaveStatus === "SKIPPED"
            ? "Contact skipped"
            : "Pending";
    incrementMap(responseStatusMap, key);
  }

  const toChart = (map: Map<string, number>) =>
    [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);

  const allSources = new Set<string>();
  for (const e of events) {
    if (e.source) allSources.add(e.source);
  }
  for (const r of responses) {
    if (r.source) allSources.add(r.source);
  }

  return {
    formName: form.name,
    periodLabel: label,
    period,
    sourceFilter,
    metrics,
    timeSeries,
    sourceBreakdown: toChart(sourceMap),
    shareBreakdown: toChart(shareMap),
    deviceBreakdown: [...deviceMap.entries()].map(([k, value]) => ({
      name: deviceLabel(k),
      value,
    })),
    smsBreakdown: toChart(smsMap),
    responseStatusBreakdown: toChart(responseStatusMap),
    availableSources: ["", ...Array.from(allSources).sort()],
  };
}
