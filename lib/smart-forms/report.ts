import { prisma } from "@/lib/db";
import { formatAccountNumber } from "@/lib/auth/account-number";
import { getSmartFormAnalytics } from "@/lib/smart-forms/analytics";
import { extractDisplayFields } from "@/lib/smart-forms/export";
import { getSiteUrl } from "@/lib/site-config";
import { resolveAnalyticsRange, type AnalyticsPeriod } from "@/lib/smart-forms/analytics-range";
import type { FormAnalyticsData } from "@/lib/smart-forms/analytics";

export const FORM_REPORT_PERIODS = ["7d", "30d", "all"] as const;
export type FormReportPeriod = (typeof FORM_REPORT_PERIODS)[number] | "today";

export function parseFormReportPeriod(raw?: string | null): FormReportPeriod {
  if (raw === "7d" || raw === "all" || raw === "today") return raw;
  return "30d";
}

export {
  isReportEmail,
  MAX_NOTICE_EMAILS,
  parseNoticeEmails,
  serializeNoticeEmails,
} from "@/lib/smart-forms/notice-emails";

export type SmartFormReportResponse = {
  id: string;
  submittedAt: string;
  source: string | null;
  name: string;
  phone: string;
  email: string;
  summary: string;
};

export type SmartFormReport = {
  form: {
    id: string;
    name: string;
    shortCode: string;
    status: string;
    publicUrl: string;
    fieldCount: number;
  };
  owner: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string;
    accountId: string | null;
  };
  period: FormReportPeriod;
  periodLabel: string;
  metrics: FormAnalyticsData["metrics"];
  sourceBreakdown: { name: string; value: number }[];
  deviceBreakdown: { name: string; value: number }[];
  responses: SmartFormReportResponse[];
  responseTotal: number;
  generatedAt: string;
};

const RESPONSE_PREVIEW_LIMIT = 40;

export async function getSmartFormReport(
  formId: string,
  options?: { ownerUserId?: string; period?: FormReportPeriod },
): Promise<SmartFormReport | null> {
  const period = options?.period ?? "30d";
  const form = await prisma.smartForm.findFirst({
    where: {
      id: formId,
      ...(options?.ownerUserId ? { userId: options.ownerUserId } : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          accountNumber: true,
        },
      },
      _count: { select: { fields: true } },
    },
  });
  if (!form) return null;

  const analytics = await getSmartFormAnalytics(form.userId, form.id, { period: period as AnalyticsPeriod });
  if (!analytics) return null;

  const { start: rangeStart } = resolveAnalyticsRange(period);

  const [responseTotal, rows] = await Promise.all([
    prisma.smartFormResponse.count({
      where: { formId: form.id, submittedAt: { gte: rangeStart } },
    }),
    prisma.smartFormResponse.findMany({
      where: { formId: form.id, submittedAt: { gte: rangeStart } },
      orderBy: { submittedAt: "desc" },
      take: RESPONSE_PREVIEW_LIMIT,
      select: {
        id: true,
        submittedAt: true,
        source: true,
        answers: { select: { fieldKey: true, fieldLabel: true, value: true } },
      },
    }),
  ]);

  return {
    form: {
      id: form.id,
      name: form.name,
      shortCode: form.shortCode,
      status: form.status,
      publicUrl: `${getSiteUrl()}/f/${form.shortCode}`,
      fieldCount: form._count.fields,
    },
    owner: {
      id: form.user.id,
      fullName: form.user.fullName,
      email: form.user.email,
      phone: form.user.phone,
      accountId:
        form.user.accountNumber != null ? formatAccountNumber(form.user.accountNumber) : null,
    },
    period,
    periodLabel: analytics.periodLabel,
    metrics: analytics.metrics,
    sourceBreakdown: analytics.sourceBreakdown.slice(0, 6),
    deviceBreakdown: analytics.deviceBreakdown.slice(0, 6),
    responses: rows.map((row) => {
      const display = extractDisplayFields(row.answers);
      const extras = row.answers
        .filter((a) => {
          const key = a.fieldKey.toLowerCase();
          return !key.includes("name") && key !== "phone" && key !== "email" && a.value.trim();
        })
        .slice(0, 3)
        .map((a) => `${a.fieldLabel}: ${a.value}`)
        .join(" · ");
      return {
        id: row.id,
        submittedAt: row.submittedAt.toISOString(),
        source: row.source,
        name: display.name,
        phone: display.phone,
        email: display.email,
        summary: extras,
      };
    }),
    responseTotal,
    generatedAt: new Date().toISOString(),
  };
}
