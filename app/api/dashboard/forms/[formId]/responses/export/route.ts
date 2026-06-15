import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { buildResponsesCsv } from "@/lib/smart-forms/export";
import { recordSmartFormEvent } from "@/lib/smart-forms/public";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ formId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { formId } = await params;
  const form = await prisma.smartForm.findFirst({
    where: { id: formId, userId: session.userId },
    include: {
      fields: { orderBy: { sortOrder: "asc" } },
      responses: {
        orderBy: { submittedAt: "desc" },
        include: { answers: true },
      },
    },
  });

  if (!form) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const ids = url.searchParams.get("ids")?.split(",").filter(Boolean);

  const responses = ids?.length
    ? form.responses.filter((r) => ids.includes(r.id))
    : form.responses;

  const inputFields = form.fields.filter(
    (f) => f.fieldType !== "SECTION" && f.fieldType !== "DIVIDER",
  );

  const csv = buildResponsesCsv(
    form.name,
    inputFields.map((f) => ({ key: f.fieldKey, label: f.label })),
    responses.map((r) => ({
      id: r.id,
      submittedAt: r.submittedAt.toISOString(),
      source: r.source,
      contactSaveStatus: r.contactSaveStatus,
      smsStatus: r.smsStatus,
      reviewedAt: r.reviewedAt?.toISOString() ?? null,
      answers: r.answers.map((a) => ({
        fieldKey: a.fieldKey,
        fieldLabel: a.fieldLabel,
        value: a.value,
      })),
    })),
  );

  await recordSmartFormEvent(form.id, session.userId, "EXPORT");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${form.slug}-responses.csv"`,
    },
  });
}
