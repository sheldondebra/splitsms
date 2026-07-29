import {
  isMailjetConfigured,
  isEmailConfigured,
  isEmailConfiguredAsync,
  isMailjetConfiguredAsync,
  getMailjetConfig,
  getActiveEmailProvider,
} from "@/lib/email/config";
import { sendMailjetEmail, testMailjetConnection } from "@/lib/email/mailjet";
import { sendSmtpEmail, testSmtpConnection } from "@/lib/email/smtp";
import { otpEmailContent } from "@/lib/email/templates";

export {
  isMailjetConfigured,
  isEmailConfigured,
  isEmailConfiguredAsync,
  isMailjetConfiguredAsync,
  getMailjetConfig,
  getActiveEmailProvider,
  testMailjetConnection,
  testSmtpConnection,
};

export async function testEmailConnection() {
  const provider = await getActiveEmailProvider();
  if (provider === "smtp") return testSmtpConnection();
  if (provider === "mailjet") return testMailjetConnection();
  return { ok: false as const, error: "Email is not configured" };
}

export type OtpEmailPurpose = "login" | "signup" | "reset";

export async function sendOtpEmail(
  to: string,
  code: string,
  purpose: OtpEmailPurpose,
) {
  const { subject, text, html } = otpEmailContent({ code, purpose });
  const configured = await isEmailConfiguredAsync();

  if (!configured) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV OTP EMAIL] ${to}: ${code} (${purpose})`);
      return { ok: true as const };
    }
    return { ok: false as const, error: "Email is not configured" };
  }

  const result = await sendEmail({ to, subject, text, html });
  if (!result.ok) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV OTP EMAIL] ${to}: ${code} (send failed: ${result.error})`);
      return { ok: true as const };
    }
    return result;
  }

  return { ok: true as const, messageId: result.messageId };
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  toName?: string;
}) {
  const provider = await getActiveEmailProvider();
  if (!provider) {
    return { ok: false as const, error: "Email is not configured" };
  }

  const primary =
    provider === "smtp" ? await sendSmtpEmail(params) : await sendMailjetEmail(params);
  if (primary.ok) return primary;

  // If the preferred provider fails, try the other configured transport.
  const { loadEmailOfficeStored, isMailjetOfficeReady, isSmtpOfficeReady } = await import(
    "@/lib/email/office-config"
  );
  const stored = await loadEmailOfficeStored();
  if (provider === "mailjet" && isSmtpOfficeReady(stored)) {
    const fallback = await sendSmtpEmail(params);
    if (fallback.ok) return fallback;
    return {
      ok: false as const,
      error: `${primary.error}; SMTP fallback: ${fallback.error}`,
    };
  }
  if (provider === "smtp" && isMailjetOfficeReady(stored)) {
    const fallback = await sendMailjetEmail(params);
    if (fallback.ok) return fallback;
    return {
      ok: false as const,
      error: `${primary.error}; Mailjet fallback: ${fallback.error}`,
    };
  }

  return primary;
}
