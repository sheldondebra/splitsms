"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession, isAdminRole } from "@/lib/auth/session";
import { testMailjetConnection } from "@/lib/email/mailjet";
import { sendEmail, isMailjetConfigured, getMailjetConfig } from "@/lib/email";
import { testEmailContent } from "@/lib/email/templates";
import { saveGatewayLastTest } from "@/lib/payments/gateway-settings";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/login");
  return session;
}

function revalidateGeneral() {
  revalidatePath("/admin/general");
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function testMailjetConnectionAction() {
  await requireAdmin();

  if (!isMailjetConfigured()) {
    await saveGatewayLastTest("mailjet_connection_test", {
      ok: false,
      error: "Set MAILJET_API_KEY and MAILJET_API_SECRET (or MAILJET_SECRET_KEY) in .env",
    });
    revalidateGeneral();
    redirect("/admin/general?test=connection&result=fail");
  }

  const result = await testMailjetConnection();
  const config = getMailjetConfig();

  await saveGatewayLastTest("mailjet_connection_test", {
    ok: result.ok,
    error: result.error ?? null,
    details: result.ok
      ? {
          fromEmail: result.fromEmail ?? config?.fromEmail,
          fromName: config?.fromName,
          sandbox: config?.sandbox ?? false,
        }
      : null,
  });

  revalidateGeneral();
  redirect(`/admin/general?test=connection&result=${result.ok ? "ok" : "fail"}`);
}

export async function sendTestEmailAction(formData: FormData) {
  await requireAdmin();

  const to = String(formData.get("testEmail") ?? "").trim().toLowerCase();
  if (!to || !isValidEmail(to)) {
    redirect("/admin/general?error=email");
  }

  if (!isMailjetConfigured()) {
    redirect("/admin/general?error=not_configured");
  }

  const { subject, text, html } = testEmailContent();
  const result = await sendEmail({ to, subject, text, html });

  await saveGatewayLastTest("mailjet_send_test", {
    ok: result.ok,
    error: !result.ok ? result.error : null,
    details: result.ok
      ? { to, messageId: "messageId" in result ? result.messageId : undefined }
      : { to },
  });

  revalidateGeneral();
  if (!result.ok) {
    redirect("/admin/general?test=send&result=fail");
  }
  redirect(`/admin/general?test=send&result=ok&to=${encodeURIComponent(to)}`);
}
