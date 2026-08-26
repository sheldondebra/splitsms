"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getRealSession, getSession, isAdminRole } from "@/lib/auth/session";
import { getSiteUrl } from "@/lib/site-config";
import { parseFormReportPeriod, type FormReportPeriod } from "@/lib/smart-forms/report";
import { sendSmartFormReport } from "@/lib/smart-forms/send-report";

function reportPath(
  scope: "admin" | "dashboard",
  formId: string,
  period: FormReportPeriod,
  extra?: Record<string, string | undefined>,
) {
  const params = new URLSearchParams({ period });
  for (const [key, value] of Object.entries(extra ?? {})) {
    if (value) params.set(key, value);
  }
  const base = scope === "admin" ? `/admin/forms/${formId}/report` : `/dashboard/forms/${formId}/report`;
  return `${base}?${params.toString()}`;
}

export async function adminSendSmartFormReportAction(formData: FormData) {
  const session = await getRealSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");

  const formId = String(formData.get("formId") ?? "").trim();
  const period = parseFormReportPeriod(String(formData.get("period") ?? "30d"));
  const to = String(formData.get("to") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!formId) {
    redirect("/admin/forms?error=form");
  }

  const result = await sendSmartFormReport({
    formId,
    period,
    actorId: session.userId,
    to: to || undefined,
    note: note || undefined,
    reportsUrl: `${getSiteUrl()}/admin/forms/${formId}/report?period=${period}`,
  });

  revalidatePath(`/admin/forms/${formId}/report`);

  if (result.status === "not_found") {
    redirect(`/admin/forms?error=form`);
  }
  if (result.status === "skipped_no_email") {
    redirect(reportPath("admin", formId, period, { error: "no_email" }));
  }
  if (result.status === "invalid_email") {
    redirect(reportPath("admin", formId, period, { error: "invalid_email" }));
  }
  if (result.status === "failed") {
    redirect(reportPath("admin", formId, period, { error: "email", detail: result.error }));
  }

  redirect(reportPath("admin", formId, period, { saved: "1" }));
}

export async function memberSendSmartFormReportAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const formId = String(formData.get("formId") ?? "").trim();
  const period = parseFormReportPeriod(String(formData.get("period") ?? "30d"));
  const to = String(formData.get("to") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!formId) {
    redirect("/dashboard/forms");
  }

  const result = await sendSmartFormReport({
    formId,
    period,
    actorId: session.userId,
    ownerUserId: session.userId,
    to: to || undefined,
    note: note || undefined,
    reportsUrl: `${getSiteUrl()}/dashboard/forms/${formId}/report?period=${period}`,
  });

  revalidatePath(`/dashboard/forms/${formId}/report`);

  if (result.status === "not_found") {
    redirect("/dashboard/forms");
  }
  if (result.status === "skipped_no_email") {
    redirect(reportPath("dashboard", formId, period, { error: "no_email" }));
  }
  if (result.status === "invalid_email") {
    redirect(reportPath("dashboard", formId, period, { error: "invalid_email" }));
  }
  if (result.status === "failed") {
    redirect(reportPath("dashboard", formId, period, { error: "email", detail: result.error }));
  }

  redirect(reportPath("dashboard", formId, period, { saved: "1" }));
}
