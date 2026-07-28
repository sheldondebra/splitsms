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
  if (provider === "smtp") {
    return sendSmtpEmail(params);
  }
  return sendMailjetEmail(params);
}
