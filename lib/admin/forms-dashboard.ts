import { prisma } from "@/lib/db";
import { formatAccountNumber } from "@/lib/auth/account-number";
import {
  ADMIN_FORMS_PAGE_SIZE,
  parseFormsPage,
} from "@/lib/admin/forms-list-url";
import type { SmartFormStatus } from "@/lib/generated/prisma/client";

const STATUSES: SmartFormStatus[] = ["DRAFT", "PUBLISHED", "CLOSED"];

export type AdminFormRow = {
  id: string;
  name: string;
  shortCode: string;
  status: SmartFormStatus;
  fieldCount: number;
  responses: number;
  views: number;
  conversionRate: number;
  lastSubmissionAt: string | null;
  smsOn: boolean;
  captchaEnabled: boolean;
  saveToContacts: boolean;
  updatedAt: string;
  createdAt: string;
  owner: {
    id: string;
    fullName: string;
    phone: string;
    accountId: string | null;
  };
};

export type AdminFormsDashboard = {
  query: string;
  statusFilter: string;
  forms: AdminFormRow[];
  stats: {
    total: number;
    published: number;
    draft: number;
    closed: number;
    owners: number;
    totalResponses: number;
    responses24h: number;
    views: number;
    smsAutomations: number;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

function statusWhere(status?: string): SmartFormStatus | undefined {
  const value = status?.toUpperCase();
  return STATUSES.includes(value as SmartFormStatus) ? (value as SmartFormStatus) : undefined;
}

export async function getAdminFormsDashboard(input?: {
  q?: string;
  status?: string;
  page?: string | number;
}): Promise<AdminFormsDashboard> {
  const q = input?.q?.trim() ?? "";
  const status = statusWhere(input?.status);
  const pageSize = ADMIN_FORMS_PAGE_SIZE;
  let page = parseFormsPage(input?.page);
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const searchOr = q
    ? [
        { name: { contains: q, mode: "insensitive" as const } },
        { shortCode: { contains: q, mode: "insensitive" as const } },
        { slug: { contains: q, mode: "insensitive" as const } },
        { user: { fullName: { contains: q, mode: "insensitive" as const } } },
        { user: { phone: { contains: q } } },
        ...(/^\d{6}$/.test(q) ? [{ user: { accountNumber: Number(q) } }] : []),
      ]
    : null;

  const where = {
    ...(status ? { status } : {}),
    ...(searchOr ? { OR: searchOr } : {}),
  };

  const [
    filteredTotal,
    total,
    published,
    draft,
    closed,
    ownerGroups,
    totalResponses,
    responses24h,
    views,
    smsAutomations,
  ] = await Promise.all([
    prisma.smartForm.count({ where }),
    prisma.smartForm.count(),
    prisma.smartForm.count({ where: { status: "PUBLISHED" } }),
    prisma.smartForm.count({ where: { status: "DRAFT" } }),
    prisma.smartForm.count({ where: { status: "CLOSED" } }),
    prisma.smartForm.groupBy({ by: ["userId"], _count: { _all: true } }),
    prisma.smartFormResponse.count(),
    prisma.smartFormResponse.count({ where: { submittedAt: { gte: since24h } } }),
    prisma.smartFormAnalyticsEvent.count({ where: { eventType: "VIEW" } }),
    prisma.smartFormSmsAutomation.count({
      where: { OR: [{ sendToRespondent: true }, { sendToAdmin: true }] },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));
  if (page > totalPages) page = totalPages;

  const forms = await prisma.smartForm.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      user: { select: { id: true, fullName: true, phone: true, accountNumber: true } },
      smsAutomation: { select: { sendToRespondent: true, sendToAdmin: true } },
      _count: { select: { responses: true, fields: true } },
    },
  });

  const formIds = forms.map((form) => form.id);
  const [viewCounts, lastSubmissions] =
    formIds.length === 0
      ? [[], []]
      : await Promise.all([
          prisma.smartFormAnalyticsEvent.groupBy({
            by: ["formId"],
            where: { formId: { in: formIds }, eventType: "VIEW" },
            _count: { id: true },
          }),
          prisma.smartFormResponse.groupBy({
            by: ["formId"],
            where: { formId: { in: formIds } },
            _max: { submittedAt: true },
          }),
        ]);

  const viewsByForm = new Map(viewCounts.map((row) => [row.formId, row._count.id]));
  const lastByForm = new Map(lastSubmissions.map((row) => [row.formId, row._max.submittedAt]));

  return {
    query: q,
    statusFilter: status ?? "all",
    forms: forms.map((form) => {
      const formViews = viewsByForm.get(form.id) ?? 0;
      const responses = form._count.responses;
      return {
        id: form.id,
        name: form.name,
        shortCode: form.shortCode,
        status: form.status,
        fieldCount: form._count.fields,
        responses,
        views: formViews,
        conversionRate: formViews > 0 ? Math.round((responses / formViews) * 1000) / 10 : 0,
        lastSubmissionAt: lastByForm.get(form.id)?.toISOString() ?? null,
        smsOn: Boolean(form.smsAutomation?.sendToRespondent || form.smsAutomation?.sendToAdmin),
        captchaEnabled: form.captchaEnabled,
        saveToContacts: form.saveToContacts,
        updatedAt: form.updatedAt.toISOString(),
        createdAt: form.createdAt.toISOString(),
        owner: {
          id: form.user.id,
          fullName: form.user.fullName,
          phone: form.user.phone,
          accountId:
            form.user.accountNumber != null
              ? formatAccountNumber(form.user.accountNumber)
              : null,
        },
      };
    }),
    stats: {
      total,
      published,
      draft,
      closed,
      owners: ownerGroups.length,
      totalResponses,
      responses24h,
      views,
      smsAutomations,
    },
    pagination: {
      page,
      pageSize,
      total: filteredTotal,
      totalPages,
    },
  };
}
