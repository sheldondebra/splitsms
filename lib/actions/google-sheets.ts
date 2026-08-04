"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getAccessTokenForUser } from "@/lib/google/connection";
import { googleConnectHref } from "@/lib/google/connect-url";
import { createSpreadsheetWithRows } from "@/lib/google/sheets";
import { GOOGLE_SHEETS_SCOPES } from "@/lib/google/scopes";
import { recordSmartFormEvent } from "@/lib/smart-forms/public";

export async function exportSmartFormToGoogleSheetsAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const formId = String(formData.get("formId") ?? "").trim();
  if (!formId) redirect("/dashboard/forms");

  const form = await prisma.smartForm.findFirst({
    where: { id: formId, userId: session.userId },
    include: {
      fields: { orderBy: { sortOrder: "asc" } },
      responses: {
        orderBy: { submittedAt: "desc" },
        take: 5000,
        include: { answers: true },
      },
    },
  });
  if (!form) redirect("/dashboard/forms");

  const token = await getAccessTokenForUser(session.userId, [...GOOGLE_SHEETS_SCOPES]);
  if (!token.ok) {
    redirect(
      googleConnectHref({
        scopes: token.missingScopes?.length
          ? token.missingScopes
          : [...GOOGLE_SHEETS_SCOPES],
        returnTo: `/dashboard/forms/${formId}/responses`,
        force: token.code === "reconnect",
      }),
    );
  }

  const inputFields = form.fields.filter(
    (f) => f.fieldType !== "SECTION" && f.fieldType !== "DIVIDER",
  );
  const headers = [
    "submitted_at",
    "source",
    "contact_status",
    "sms_status",
    ...inputFields.map((f) => f.label),
  ];
  const rows = form.responses.map((r) => {
    const map = new Map(r.answers.map((a) => [a.fieldKey, a.value]));
    return [
      r.submittedAt.toISOString(),
      r.source ?? "",
      r.contactSaveStatus,
      r.smsStatus,
      ...inputFields.map((f) => map.get(f.fieldKey) ?? ""),
    ];
  });

  let sheet: { spreadsheetId: string; spreadsheetUrl: string };
  try {
    sheet = await createSpreadsheetWithRows(token.accessToken, {
      title: `SplitSMS · ${form.name} · ${new Date().toISOString().slice(0, 10)}`,
      headers,
      rows,
    });
  } catch {
    redirect(`/dashboard/forms/${formId}/responses?error=sheets_export`);
  }

  await prisma.smartFormExport.create({
    data: {
      formId: form.id,
      userId: session.userId,
        exportType: "EXCEL",
        fileUrl: sheet.spreadsheetUrl,
      rowCount: rows.length,
    },
  });
  await recordSmartFormEvent(form.id, session.userId, "EXPORT");

  redirect(
    `/dashboard/forms/${formId}/responses?sheetsUrl=${encodeURIComponent(sheet.spreadsheetUrl)}`,
  );
}
