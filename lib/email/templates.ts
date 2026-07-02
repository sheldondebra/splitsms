import { getSiteUrl, siteName } from "@/lib/site-config";

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

export function adminMemberOutreachEmailContent(params: {
  memberName: string;
  subject: string;
  bodyText: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  const subject = params.subject;
  const text = params.bodyText;
  const ctaBlock =
    params.ctaHref && params.ctaLabel
      ? `<p style="margin: 20px 0;"><a href="${params.ctaHref}" style="display:inline-block;background:#ea580c;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;">${params.ctaLabel}</a></p>`
      : "";
  const ctaText =
    params.ctaHref && params.ctaLabel ? `\n${params.ctaLabel}: ${params.ctaHref}\n` : "";

  const htmlBody = params.bodyText
    .split("\n")
    .map((line) => `<p style="margin:0 0 12px;font-size:14px;color:#525252;line-height:1.5;">${line || "&nbsp;"}</p>`)
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #171717; max-width: 520px; margin: 0 auto; padding: 24px;">
  ${htmlBody}
  ${ctaBlock}
  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
  <p style="font-size: 12px; color: #a3a3a3;">${siteName}</p>
</body>
</html>`.trim();

  return { subject, text: text + ctaText, html };
}

export function senderIdSubmittedMemberContent(params: {
  value: string;
  memberName: string;
  purpose: string;
}) {
  const subject = `Sender ID submitted for registration: ${params.value}`;
  const text = `Hi ${params.memberName},

Your sender ID "${params.value}" has been submitted to our SMS carriers for registration.

Registration purpose: ${params.purpose}

We'll notify you when it is approved and ready for sending. You cannot use this sender ID for SMS until carrier registration completes.

Register or manage sender IDs: ${getSiteUrl()}/dashboard/sender-ids

— ${siteName}`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #171717; max-width: 480px; margin: 0 auto; padding: 24px;">
  <p style="font-size: 15px;">Hi ${params.memberName},</p>
  <p style="font-size: 14px; color: #525252;">Your sender ID <strong style="font-family:monospace;">${params.value}</strong> has been submitted to our SMS carriers for registration.</p>
  <p style="font-size: 13px; color: #525252; margin-top: 12px;"><strong>Purpose:</strong> ${params.purpose}</p>
  <p style="font-size: 13px; color: #737373; margin-top: 12px;">We'll email you when it is approved and ready for sending.</p>
  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
  <p style="font-size: 12px; color: #a3a3a3;">${siteName}</p>
</body>
</html>`.trim();

  return { subject, text, html };
}

export function senderIdRejectedMemberContent(params: {
  value: string;
  memberName: string;
  reason: string;
}) {
  const registerUrl = `${getSiteUrl()}/dashboard/sender-ids`;
  const subject = `Sender ID not approved: ${params.value}`;
  const text = `Hi ${params.memberName},

Your sender ID request "${params.value}" was not approved on ${siteName}.

Reason: ${params.reason}

You can register a different sender ID that meets naming requirements:
${registerUrl}

— ${siteName}`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #171717; max-width: 480px; margin: 0 auto; padding: 24px;">
  <p style="font-size: 15px;">Hi ${params.memberName},</p>
  <p style="font-size: 14px; color: #525252;">Your sender ID request <strong style="font-family:monospace;">${params.value}</strong> was not approved.</p>
  <p style="font-size: 13px; color: #525252; margin-top: 12px;"><strong>Reason:</strong> ${params.reason}</p>
  <p style="font-size: 13px; color: #525252; margin-top: 16px;">You may register a different sender ID that meets carrier naming rules.</p>
  <p style="margin-top: 16px;"><a href="${registerUrl}" style="color: #ea580c; font-weight: 600;">Register a sender ID</a></p>
  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
  <p style="font-size: 12px; color: #a3a3a3;">${siteName}</p>
</body>
</html>`.trim();

  return { subject, text, html };
}

export type ReceiptEmailKind = "wallet_topup" | "credit_purchase";

export function receiptEmailContent(params: {
  kind: ReceiptEmailKind;
  memberName: string;
  receiptNo: string;
  amount: number;
  currency: string;
  date: string;
  credits?: number;
  creditsAfter?: number;
  walletBalanceAfter?: number;
  paymentMethod?: string;
  paidWith?: string | null;
  invoicesUrl: string;
}) {
  const isWallet = params.kind === "wallet_topup";
  const title = isWallet ? "Wallet top-up receipt" : "SMS credits receipt";
  const subject = `${siteName} — ${title} ${params.receiptNo}`;

  const amountLine = `${params.currency} ${params.amount.toFixed(2)}`;
  const summary = isWallet
    ? `Your wallet was credited with <strong>${amountLine}</strong>.`
    : `You purchased <strong>${params.credits?.toLocaleString() ?? "—"} SMS credits</strong> for ${amountLine}.`;

  const detailRows: { label: string; value: string }[] = [
    { label: "Receipt", value: params.receiptNo },
    { label: "Date", value: params.date },
    { label: "Type", value: isWallet ? "Wallet top-up" : "SMS credits" },
    { label: "Amount", value: amountLine },
  ];

  if (isWallet && params.paymentMethod) {
    detailRows.push({ label: "Payment method", value: params.paymentMethod });
  }
  if (isWallet && params.paidWith) {
    detailRows.push({ label: "Paid with", value: params.paidWith });
  }
  if (!isWallet && params.credits != null) {
    detailRows.push({ label: "Credits", value: params.credits.toLocaleString() });
  }
  if (params.walletBalanceAfter != null) {
    detailRows.push({
      label: "Wallet balance",
      value: `${params.currency} ${params.walletBalanceAfter.toFixed(2)}`,
    });
  }
  if (!isWallet && params.creditsAfter != null) {
    detailRows.push({ label: "Credit balance", value: params.creditsAfter.toLocaleString() });
  }

  const rowsHtml = detailRows
    .map(
      (row) =>
        `<tr><td style="color:#737373;padding:6px 0;vertical-align:top;">${row.label}</td><td style="padding:6px 0 6px 16px;font-weight:600;text-align:right;">${row.value}</td></tr>`,
    )
    .join("");

  const textDetails = detailRows.map((r) => `${r.label}: ${r.value}`).join("\n");

  const text = `Hi ${params.memberName},

${isWallet ? `Your wallet was credited with ${amountLine}.` : `You purchased ${params.credits} SMS credits for ${amountLine}.`}

${textDetails}

View your invoices: ${params.invoicesUrl}

— ${siteName}`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; color: #171717; background: #fafafa; margin: 0; padding: 24px 16px;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 16px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); padding: 24px 28px;">
      <p style="margin: 0; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.85);">${siteName}</p>
      <h1 style="margin: 8px 0 0; font-size: 22px; font-weight: 700; color: #ffffff;">${title}</h1>
    </div>
    <div style="padding: 28px;">
      <p style="font-size: 15px; margin: 0 0 8px;">Hi ${params.memberName},</p>
      <p style="font-size: 14px; color: #525252; margin: 0 0 24px;">${summary}</p>
      <table style="width: 100%; font-size: 14px; border-top: 1px solid #f0f0f0; border-bottom: 1px solid #f0f0f0; margin-bottom: 24px;">
        ${rowsHtml}
      </table>
      <a href="${params.invoicesUrl}" style="display: inline-block; background: #171717; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 12px 18px; border-radius: 10px;">View invoices</a>
      <p style="font-size: 12px; color: #a3a3a3; margin: 24px 0 0;">Thank you for using ${siteName}.</p>
    </div>
  </div>
</body>
</html>`.trim();

  return { subject, text, html };
}

function supportStatusLabel(status: string): string {
  const upper = status.toUpperCase();
  if (upper === "IN_PROGRESS") return "In progress";
  if (upper === "OPEN") return "Open";
  if (upper === "RESOLVED") return "Resolved";
  if (upper === "CLOSED") return "Closed";
  return status;
}

export function supportTicketCreatedMemberContent(params: {
  memberName: string;
  ticketRef: string;
  subject: string;
  message: string;
  supportUrl: string;
}) {
  const subject = `${siteName} — support ticket ${params.ticketRef} received`;
  const preview =
    params.message.length > 200 ? `${params.message.slice(0, 197)}...` : params.message;

  const text = `Hi ${params.memberName},

We received your support request ${params.ticketRef}.

Subject: ${params.subject}

${preview}

We'll reply by email or SMS. Track the conversation: ${params.supportUrl}

— ${siteName}`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #171717; max-width: 520px; margin: 0 auto; padding: 24px;">
  <p style="font-size: 15px;">Hi ${params.memberName},</p>
  <p style="font-size: 14px; color: #525252;">We received your support request <strong style="font-family:monospace;">${params.ticketRef}</strong>.</p>
  <p style="font-size: 14px; margin: 16px 0 8px;"><strong>${params.subject}</strong></p>
  <blockquote style="margin: 0 0 16px; padding: 12px 16px; border-left: 3px solid #ea580c; background: #fafafa; font-size: 14px; white-space: pre-wrap;">${preview.replace(/</g, "&lt;")}</blockquote>
  <p style="font-size: 13px; color: #525252;">We'll reply by email or SMS.</p>
  <p style="font-size: 13px;"><a href="${params.supportUrl}">View ticket ${params.ticketRef}</a></p>
  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
  <p style="font-size: 12px; color: #a3a3a3;">${siteName}</p>
</body>
</html>`.trim();

  return { subject, text, html };
}

export function supportTicketReplyMemberContent(params: {
  memberName: string;
  ticketRef: string;
  subject: string;
  replyBody: string;
  supportUrl: string;
}) {
  const subject = `${siteName} — reply on ticket ${params.ticketRef}`;
  const text = `Hi ${params.memberName},

Our team replied to your support request "${params.subject}" (${params.ticketRef}):

${params.replyBody}

View the conversation: ${params.supportUrl}

— ${siteName}`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #171717; max-width: 520px; margin: 0 auto; padding: 24px;">
  <p style="font-size: 15px;">Hi ${params.memberName},</p>
  <p style="font-size: 14px; color: #525252;">Our team replied to <strong>${params.subject}</strong> (<strong style="font-family:monospace;">${params.ticketRef}</strong>):</p>
  <blockquote style="margin: 16px 0; padding: 12px 16px; border-left: 3px solid #ea580c; background: #fafafa; font-size: 14px; white-space: pre-wrap;">${params.replyBody.replace(/</g, "&lt;")}</blockquote>
  <p style="font-size: 13px;"><a href="${params.supportUrl}">Open ticket ${params.ticketRef}</a></p>
  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
  <p style="font-size: 12px; color: #a3a3a3;">${siteName}</p>
</body>
</html>`.trim();

  return { subject, text, html };
}

export function supportTicketStatusMemberContent(params: {
  memberName: string;
  ticketRef: string;
  subject: string;
  status: string;
  supportUrl: string;
}) {
  const statusLabel = supportStatusLabel(params.status);
  const subject = `${siteName} — ticket ${params.ticketRef} is ${statusLabel.toLowerCase()}`;
  const text = `Hi ${params.memberName},

Your support ticket ${params.ticketRef} ("${params.subject}") is now ${statusLabel.toLowerCase()}.

View the conversation: ${params.supportUrl}

— ${siteName}`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #171717; max-width: 520px; margin: 0 auto; padding: 24px;">
  <p style="font-size: 15px;">Hi ${params.memberName},</p>
  <p style="font-size: 14px; color: #525252;">Your support ticket <strong style="font-family:monospace;">${params.ticketRef}</strong> (<strong>${params.subject}</strong>) is now <strong>${statusLabel.toLowerCase()}</strong>.</p>
  <p style="font-size: 13px;"><a href="${params.supportUrl}">Open ticket ${params.ticketRef}</a></p>
  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
  <p style="font-size: 12px; color: #a3a3a3;">${siteName}</p>
</body>
</html>`.trim();

  return { subject, text, html };
}

export function supportTicketAdminAlertContent(params: {
  ticketRef: string;
  subject: string;
  message: string;
  memberName: string;
  memberPhone: string;
  memberEmail?: string | null;
  adminUrl: string;
}) {
  const preview =
    params.message.length > 240 ? `${params.message.slice(0, 237)}...` : params.message;
  const subject = `${siteName} — new support ticket ${params.ticketRef}`;
  const text = `New support ticket on ${siteName}.

Ticket: ${params.ticketRef}
Subject: ${params.subject}
Member: ${params.memberName}
Phone: ${params.memberPhone}
${params.memberEmail ? `Email: ${params.memberEmail}` : ""}

Message:
${preview}

Review: ${params.adminUrl}

— ${siteName}`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #171717; max-width: 520px; margin: 0 auto; padding: 24px;">
  <p style="font-size: 15px;">New support ticket <strong style="font-family:monospace;">${params.ticketRef}</strong></p>
  <table style="width:100%; font-size:14px; margin: 16px 0;">
    <tr><td style="color:#737373;padding:4px 0;">Subject</td><td>${params.subject}</td></tr>
    <tr><td style="color:#737373;padding:4px 0;">Member</td><td>${params.memberName}</td></tr>
    <tr><td style="color:#737373;padding:4px 0;">Phone</td><td>${params.memberPhone}</td></tr>
    ${params.memberEmail ? `<tr><td style="color:#737373;padding:4px 0;">Email</td><td>${params.memberEmail}</td></tr>` : ""}
  </table>
  <blockquote style="margin: 0 0 16px; padding: 12px 16px; border-left: 3px solid #ea580c; background: #fafafa; font-size: 14px; white-space: pre-wrap;">${preview.replace(/</g, "&lt;")}</blockquote>
  <p style="font-size: 13px;"><a href="${params.adminUrl}">Open in admin</a></p>
  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
  <p style="font-size: 12px; color: #a3a3a3;">${siteName}</p>
</body>
</html>`.trim();

  return { subject, text, html };
}
