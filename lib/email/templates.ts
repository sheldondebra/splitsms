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

export function senderIdAdminAlertContent(params: {
  value: string;
  countryCode: string;
  memberName: string;
  memberPhone: string;
  memberEmail?: string | null;
}) {
  const subject = `New sender ID request: ${params.value}`;
  const text = `A member requested a new sender ID on ${siteName}.

Sender ID: ${params.value}
Country: ${params.countryCode}
Member: ${params.memberName}
Phone: ${params.memberPhone}
${params.memberEmail ? `Email: ${params.memberEmail}` : ""}

Review and approve in Admin → Sender IDs before it is submitted to carriers.

— ${siteName}`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #171717; max-width: 520px; margin: 0 auto; padding: 24px;">
  <p style="font-size: 15px;">A member requested a new <strong>sender ID</strong>.</p>
  <table style="width:100%; font-size:14px; margin: 16px 0;">
    <tr><td style="color:#737373;padding:4px 0;">Sender ID</td><td style="font-family:monospace;font-weight:700;">${params.value}</td></tr>
    <tr><td style="color:#737373;padding:4px 0;">Country</td><td>${params.countryCode}</td></tr>
    <tr><td style="color:#737373;padding:4px 0;">Member</td><td>${params.memberName}</td></tr>
    <tr><td style="color:#737373;padding:4px 0;">Phone</td><td>${params.memberPhone}</td></tr>
    ${params.memberEmail ? `<tr><td style="color:#737373;padding:4px 0;">Email</td><td>${params.memberEmail}</td></tr>` : ""}
  </table>
  <p style="font-size: 13px; color: #525252;">Approve in Admin → Sender IDs before it is submitted to carriers.</p>
  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
  <p style="font-size: 12px; color: #a3a3a3;">${siteName}</p>
</body>
</html>`.trim();

  return { subject, text, html };
}

export function senderIdApprovedMemberContent(params: {
  value: string;
  memberName: string;
}) {
  const subject = `Sender ID approved: ${params.value}`;
  const text = `Hi ${params.memberName},

Your sender ID "${params.value}" is now approved on ${siteName} and ready to use when sending SMS.

— ${siteName}`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #171717; max-width: 480px; margin: 0 auto; padding: 24px;">
  <p style="font-size: 15px;">Hi ${params.memberName},</p>
  <p style="font-size: 14px; color: #525252;">Your sender ID <strong style="font-family:monospace;">${params.value}</strong> is now <strong>approved</strong> and ready to use.</p>
  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
  <p style="font-size: 12px; color: #a3a3a3;">${siteName}</p>
</body>
</html>`.trim();

  return { subject, text, html };
}
