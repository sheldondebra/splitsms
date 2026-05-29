import { siteName } from "@/lib/site-config";

export function otpEmailContent(params: {
  code: string;
  purpose: "login" | "signup" | "reset";
}) {
  const { code, purpose } = params;

  const titles = {
    login: "Your sign-in code",
    signup: "Verify your account",
    reset: "Reset your password",
  };

  const intros = {
    login: `Use this code to sign in to ${siteName}:`,
    signup: `Use this code to verify your ${siteName} account:`,
    reset: `Use this code to reset your ${siteName} password:`,
  };

  const subject = `${titles[purpose]} — ${code}`;
  const text = `${intros[purpose]}

${code}

This code expires in 10 minutes. If you didn't request this, you can ignore this email.

— ${siteName}`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #171717; max-width: 480px; margin: 0 auto; padding: 24px;">
  <p style="font-size: 14px; color: #525252;">${intros[purpose]}</p>
  <p style="font-size: 32px; font-weight: 700; letter-spacing: 0.25em; margin: 24px 0; color: #ea580c;">${code}</p>
  <p style="font-size: 13px; color: #737373;">Expires in 10 minutes. Do not share this code.</p>
  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
  <p style="font-size: 12px; color: #a3a3a3;">${siteName}</p>
</body>
</html>`.trim();

  return { subject, text, html };
}

export function testEmailContent() {
  const subject = `${siteName} — test email`;
  const text = `This is a test email from ${siteName}.

If you received this, Mailjet is configured correctly for OTP and transactional email.

— ${siteName}`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #171717; max-width: 480px; margin: 0 auto; padding: 24px;">
  <p style="font-size: 15px;">This is a <strong>test email</strong> from ${siteName}.</p>
  <p style="font-size: 14px; color: #525252;">If you received this, Mailjet is configured correctly for OTP and transactional email.</p>
  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
  <p style="font-size: 12px; color: #a3a3a3;">${siteName}</p>
</body>
</html>`.trim();

  return { subject, text, html };
}
