"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession, isAdminRole } from "@/lib/auth/session";
import { testMailjetConnection } from "@/lib/email/mailjet";
import { sendEmail, isMailjetConfiguredAsync } from "@/lib/email";
import { testEmailContent } from "@/lib/email/templates";
import { saveMailjetOfficeConfig } from "@/lib/email/office-config";
import {
  parseNotifyEmails,
  parseNotifyPhones,
  saveGeneralOfficeConfig,
} from "@/lib/general-office/config";
import {
  loadSlackOfficeConfig,
  saveSlackOfficeConfig,
} from "@/lib/slack/config";
import { testSlackConnection } from "@/lib/slack/client";
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

export async function saveMailjetOfficeConfigAction(formData: FormData) {
  const session = await requireAdmin();

  const fromEmail = String(formData.get("fromEmail") ?? "").trim();
  const fromName = String(formData.get("fromName") ?? "").trim();

  if (!fromEmail || !isValidEmail(fromEmail)) {
    redirect("/admin/general?error=from_email");
  }
  if (!fromName) {
    redirect("/admin/general?error=from_name");
  }

  await saveMailjetOfficeConfig(
    {
      apiKey: String(formData.get("apiKey") ?? "").trim() || undefined,
      apiSecret: String(formData.get("apiSecret") ?? "").trim() || undefined,
      fromEmail,
      fromName,
      sandbox: formData.get("sandbox") === "on",
    },
    session.userId,
  );

  revalidateGeneral();
  redirect("/admin/general?saved=mailjet");
}

export async function saveGeneralOfficeConfigAction(formData: FormData) {
  const session = await requireAdmin();

  await saveGeneralOfficeConfig(
    {
      notifyEmails: parseNotifyEmails(String(formData.get("notifyEmails") ?? "")),
      notifyPhones: parseNotifyPhones(String(formData.get("notifyPhones") ?? "")),
      notifyAdminUsers: formData.get("notifyAdminUsers") === "on",
    },
    session.userId,
  );

  revalidateGeneral();
  redirect("/admin/general?saved=alerts");
}

export async function testMailjetConnectionAction() {
  await requireAdmin();

  if (!(await isMailjetConfiguredAsync())) {
    await saveGatewayLastTest("mailjet_connection_test", {
      ok: false,
      error:
        "Set Mailjet API keys below or add MAILJET_API_KEY and MAILJET_API_SECRET to .env",
    });
    revalidateGeneral();
    redirect("/admin/general?test=connection&result=fail");
  }

  const result = await testMailjetConnection();
  const { loadMailjetOfficeConfig } = await import("@/lib/email/office-config");
  const config = await loadMailjetOfficeConfig();

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

  if (!(await isMailjetConfiguredAsync())) {
    redirect("/admin/general?error=not_configured");
  }

  const { subject, text, html } = testEmailContent();
  const { loadMailjetOfficeConfig } = await import("@/lib/email/office-config");
  const activeConfig = await loadMailjetOfficeConfig();
  const result = await sendEmail({ to, subject, text, html });

  await saveGatewayLastTest("mailjet_send_test", {
    ok: result.ok,
    error: !result.ok ? result.error : null,
    details: result.ok
      ? {
          to,
          fromEmail: activeConfig?.fromEmail,
          fromName: activeConfig?.fromName,
          messageId: "messageId" in result ? result.messageId : undefined,
        }
      : { to, fromEmail: activeConfig?.fromEmail },
  });

  revalidateGeneral();
  if (!result.ok) {
    redirect("/admin/general?test=send&result=fail");
  }
  redirect(`/admin/general?test=send&result=ok&to=${encodeURIComponent(to)}`);
}

export async function saveSlackOfficeConfigAction(formData: FormData) {
  const session = await requireAdmin();
  const current = await loadSlackOfficeConfig();

  const webhookRaw = String(formData.get("webhookUrl") ?? "").trim();
  const supportBotTokenRaw = String(formData.get("supportBotToken") ?? "").trim();
  const supportSigningSecretRaw = String(formData.get("supportSigningSecret") ?? "").trim();

  await saveSlackOfficeConfig(
    {
      enabled: formData.get("enabled") === "on",
      webhookUrl: webhookRaw || current.webhookUrl,
      supportThreadsEnabled: formData.get("supportThreadsEnabled") === "on",
      supportBotToken: supportBotTokenRaw || current.supportBotToken,
      supportChannelId: String(formData.get("supportChannelId") ?? "").trim(),
      supportSigningSecret: supportSigningSecretRaw || current.supportSigningSecret,
      notifyUserRegistration: formData.get("notifyUserRegistration") === "on",
      notifyUserLogin: formData.get("notifyUserLogin") === "on",
      notifyAuthFailures: formData.get("notifyAuthFailures") === "on",
      notifySenderIdRequests: formData.get("notifySenderIdRequests") === "on",
      notifyOfflinePayments: formData.get("notifyOfflinePayments") === "on",
      notifyOnlinePayments: formData.get("notifyOnlinePayments") === "on",
      notifySupportTickets: formData.get("notifySupportTickets") === "on",
      notifyStuckSms: formData.get("notifyStuckSms") === "on",
      notifySmsFailures: formData.get("notifySmsFailures") === "on",
      notifySmsBatchResults: formData.get("notifySmsBatchResults") === "on",
    },
    session.userId,
  );

  revalidateGeneral();
  redirect("/admin/general?saved=slack");
}

export async function testSlackConnectionAction() {
  await requireAdmin();

  const config = await loadSlackOfficeConfig();
  const result = await testSlackConnection(config);

  await saveGatewayLastTest("slack_connection_test", {
    ok: result.ok,
    error: result.ok ? null : result.error,
    details: result.ok ? { webhook: Boolean(config.webhookUrl) } : null,
  });

  revalidateGeneral();
  redirect(`/admin/general?test=slack&result=${result.ok ? "ok" : "fail"}`);
}
