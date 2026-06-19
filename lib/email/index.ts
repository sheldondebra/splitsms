import { isMailjetConfigured, isMailjetConfiguredAsync, getMailjetConfig } from "@/lib/email/config";
import { sendMailjetEmail, testMailjetConnection } from "@/lib/email/mailjet";
import { otpEmailContent } from "@/lib/email/templates";

export { isMailjetConfigured, isMailjetConfiguredAsync, getMailjetConfig, testMailjetConnection };

export type OtpEmailPurpose = "login" | "signup" | "reset";

export async function sendOtpEmail(
  to: string,
  code: string,
  purpose: OtpEmailPurpose,
) {
  const { subject, text, html } = otpEmailContent({ code, purpose });

  if (!isMailjetConfigured()) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV OTP EMAIL] ${to}: ${code} (${purpose})`);
      return { ok: true as const };
    }
    return { ok: false as const, error: "Mailjet is not configured" };
  }

  const result = await sendMailjetEmail({ to, subject, text, html });
  if (!result.ok) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV OTP EMAIL] ${to}: ${code} (Mailjet failed: ${result.error})`);
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
  if (!(await isMailjetConfiguredAsync())) {
    return { ok: false as const, error: "Mailjet is not configured" };
  }
  return sendMailjetEmail(params);
}
