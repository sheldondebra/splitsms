"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getRealSession as getSession, isAdminRole } from "@/lib/auth/session";
import { testEmailConnection, sendEmail, isEmailConfiguredAsync } from "@/lib/email";
import { testEmailContent } from "@/lib/email/templates";
import {
  saveEmailOfficeConfig,
  loadEmailOfficeStored,
  type EmailProvider,
} from "@/lib/email/office-config";
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

export async function saveEmailOfficeConfigAction(formData: FormData) {
  const session = await requireAdmin();

  const fromEmail = String(formData.get("fromEmail") ?? "").trim();
  const fromName = String(formData.get("fromName") ?? "").trim();
  const providerRaw = String(formData.get("provider") ?? "mailjet").trim();
  const provider: EmailProvider =
    providerRaw === "smtp" || providerRaw === "resend" || providerRaw === "mailjet"
      ? providerRaw
      : "mailjet";
  const smtpHost = String(formData.get("smtpHost") ?? "").trim();
  const smtpUser = String(formData.get("smtpUser") ?? "").trim();
  const smtpPortRaw = Number(String(formData.get("smtpPort") ?? "").trim());

  if (!fromEmail || !isValidEmail(fromEmail)) {
    redirect("/admin/general?error=from_email");
  }
  if (!fromName) {
    redirect("/admin/general?error=from_name");
  }
  if (provider === "smtp" && !smtpHost) {
    redirect("/admin/general?error=smtp_host");
  }
  if (provider === "smtp" && !smtpUser) {
    redirect("/admin/general?error=smtp_user");
  }

  await saveEmailOfficeConfig(
    {
      provider,
      apiKey: String(formData.get("apiKey") ?? "").trim() || undefined,
      apiSecret: String(formData.get("apiSecret") ?? "").trim() || undefined,
      resendApiKey: String(formData.get("resendApiKey") ?? "").trim() || undefined,
      fromEmail,
      fromName,
      sandbox: formData.get("sandbox") === "on",
      smtpHost,
      smtpPort: Number.isFinite(smtpPortRaw) && smtpPortRaw > 0 ? smtpPortRaw : undefined,
      smtpSecure: formData.get("smtpSecure") === "on",
      smtpUser,
      smtpPassword: String(formData.get("smtpPassword") ?? "").trim() || undefined,
      headerImageUrl: String(formData.get("headerImageUrl") ?? "").trim(),
      headerImagePosition:
        String(formData.get("headerImagePosition") ?? "above").trim() === "below"
          ? "below"
          : "above",
    },
    session.userId,
  );

  revalidateGeneral();
  redirect("/admin/general?saved=email");
}

/** @deprecated Use saveEmailOfficeConfigAction */
export const saveMailjetOfficeConfigAction = saveEmailOfficeConfigAction;

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

export async function testEmailConnectionAction() {
  await requireAdmin();

  if (!(await isEmailConfiguredAsync())) {
    await saveGatewayLastTest("email_connection_test", {
      ok: false,
      error:
        "Configure Resend, Mailjet, or SMTP credentials below, or add them to .env",
    });
    revalidateGeneral();
    redirect("/admin/general?test=connection&result=fail");
  }

  const result = await testEmailConnection();
  const stored = await loadEmailOfficeStored();

  await saveGatewayLastTest("email_connection_test", {
    ok: result.ok,
    error: result.error ?? null,
    details: result.ok
      ? {
          provider: stored.provider,
          fromEmail: "fromEmail" in result ? result.fromEmail : stored.fromEmail,
          fromName: stored.fromName,
          host: "host" in result ? result.host : undefined,
          sandbox: stored.provider === "mailjet" ? stored.sandbox : false,
          senderStatus: "senderStatus" in result ? result.senderStatus : undefined,
          domainStatus:
            "domainStatus" in result ? result.domainStatus : undefined,
        }
      : null,
  });

  revalidateGeneral();
  redirect(`/admin/general?test=connection&result=${result.ok ? "ok" : "fail"}`);
}

/** @deprecated Use testEmailConnectionAction */
export const testMailjetConnectionAction = testEmailConnectionAction;

export async function sendTestEmailAction(formData: FormData) {
  await requireAdmin();

  const to = String(formData.get("testEmail") ?? "").trim().toLowerCase();
  if (!to || !isValidEmail(to)) {
    redirect("/admin/general?error=email");
  }

  if (!(await isEmailConfiguredAsync())) {
    redirect("/admin/general?error=not_configured");
  }

  const { subject, text, html } = await testEmailContent();
  const stored = await loadEmailOfficeStored();
  const result = await sendEmail({ to, subject, text, html });

  await saveGatewayLastTest("email_send_test", {
    ok: result.ok,
    error: !result.ok ? result.error : null,
    details: result.ok
      ? {
          to,
          provider: stored.provider,
          fromEmail: stored.fromEmail,
          fromName: stored.fromName,
          messageId: "messageId" in result ? result.messageId : undefined,
        }
      : { to, fromEmail: stored.fromEmail, provider: stored.provider },
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
      notifyLowBalances: formData.get("notifyLowBalances") === "on",
      notifySystemSync: formData.get("notifySystemSync") === "on",
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
