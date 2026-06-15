import { prisma } from "@/lib/db";
import type { SmartFormStatus } from "@/lib/generated/prisma/client";

export async function getSmartFormsForUser(
  userId: string,
  params: { q?: string; status?: SmartFormStatus; page?: number },
) {
  const page = params.page ?? 1;
  const perPage = 24;

  const where = {
    userId,
    ...(params.status ? { status: params.status } : {}),
    ...(params.q
      ? {
          OR: [
            { name: { contains: params.q, mode: "insensitive" as const } },
            { description: { contains: params.q, mode: "insensitive" as const } },
            { shortCode: { contains: params.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const forms = await prisma.smartForm.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip: (page - 1) * perPage,
    take: perPage,
    include: {
      contactGroup: { select: { name: true } },
      _count: { select: { responses: true, fields: true } },
    },
  });

  const formIds = forms.map((f) => f.id);

  const [total, viewCounts, submitCounts, qrCounts, lastSubmissions] = await Promise.all([
    prisma.smartForm.count({ where }),
    prisma.smartFormAnalyticsEvent.groupBy({
      by: ["formId"],
      where: { formId: { in: formIds }, eventType: "VIEW" },
      _count: { id: true },
    }),
    prisma.smartFormAnalyticsEvent.groupBy({
      by: ["formId"],
      where: { formId: { in: formIds }, eventType: "SUBMIT" },
      _count: { id: true },
    }),
    prisma.smartFormAnalyticsEvent.groupBy({
      by: ["formId"],
      where: { formId: { in: formIds }, eventType: "QR_SCAN" },
      _count: { id: true },
    }),
    prisma.smartFormResponse.groupBy({
      by: ["formId"],
      where: { formId: { in: formIds } },
      _max: { submittedAt: true },
    }),
  ]);

  const viewsByForm = new Map(viewCounts.map((r) => [r.formId, r._count.id]));
  const submitsByForm = new Map(submitCounts.map((r) => [r.formId, r._count.id]));
  const qrByForm = new Map(qrCounts.map((r) => [r.formId, r._count.id]));
  const lastByForm = new Map(lastSubmissions.map((r) => [r.formId, r._max.submittedAt]));

  const rows = forms.map((form) => {
    const views = viewsByForm.get(form.id) ?? 0;
    const submissions = form._count.responses;
    const conversionRate = views > 0 ? Math.round((submissions / views) * 1000) / 10 : 0;

    return {
      id: form.id,
      name: form.name,
      description: form.description,
      status: form.status,
      shortCode: form.shortCode,
      slug: form.slug,
      fieldCount: form._count.fields,
      views,
      submissions,
      conversionRate,
      qrScans: qrByForm.get(form.id) ?? 0,
      contactGroupName: form.contactGroup?.name ?? null,
      saveToContacts: form.saveToContacts,
      lastSubmissionAt: lastByForm.get(form.id)?.toISOString() ?? null,
      createdAt: form.createdAt.toISOString(),
      updatedAt: form.updatedAt.toISOString(),
      publishedAt: form.publishedAt?.toISOString() ?? null,
    };
  });

  return { forms: rows, total, page, perPage };
}

export async function getSmartFormForUser(userId: string, formId: string) {
  return prisma.smartForm.findFirst({
    where: { id: formId, userId },
    include: {
      fields: { orderBy: { sortOrder: "asc" } },
      contactGroup: { select: { id: true, name: true } },
      smsAutomation: true,
    },
  });
}
