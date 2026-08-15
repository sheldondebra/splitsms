import {
  emailCodeBlock,
  emailDetailTable,
  emailQuote,
  emailStatusPill,
  escapeHtml,
  stripSignatureFooter,
  textToEmailParagraphs,
} from "@/lib/email/layout";
import { renderEmailLayout } from "@/lib/email/render";
import { getSiteUrl, siteName } from "@/lib/site-config";

export async function otpEmailContent(params: {
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
    login: `Use this code to sign in to ${siteName}.`,
    signup: `Use this code to verify your ${siteName} account.`,
    reset: `Use this code to reset your ${siteName} password.`,
  };

  const subject = `${titles[purpose]} — ${code}`;
  const text = `${intros[purpose]}

${code}

This code expires in 10 minutes. If you didn't request this, you can ignore this email.

— ${siteName}`;

  const html = await renderEmailLayout({
    eyebrow: siteName,
    headline: titles[purpose],
    preheader: `${intros[purpose]} Code: ${code}`,
    bodyHtml: `${textToEmailParagraphs(intros[purpose])}${emailCodeBlock(code, "Expires in 10 minutes · Do not share this code")}`,
    footerNote: "If you didn't request this code, you can safely ignore this email.",
  });

  return { subject, text, html };
}

export async function testEmailContent() {
  const subject = `${siteName} — test email`;
  const text = `This is a test email from ${siteName}.

If you received this, your email provider is configured correctly for OTP and transactional email.`;

  const html = await renderEmailLayout({
    headline: "Test email",
    preheader: "Your email delivery is working.",
    bodyHtml: textToEmailParagraphs(
      "This is a test email from your platform.\n\nIf you received this, email delivery is configured correctly for OTP codes, receipts, support replies, and marketing messages.",
    ),
    footerNote: "This message was sent from Admin → General.",
  });

  return { subject, text, html };
}

export async function accountWelcomeEmailContent(params: {
  memberName: string;
  dashboardUrl?: string;
}) {
  const firstName = params.memberName.trim().split(/\s+/)[0] || "there";
  const dashboardUrl = params.dashboardUrl ?? `${getSiteUrl()}/dashboard`;
  const subject = `Welcome to ${siteName}`;
  const text = `Hi ${firstName},

Welcome to ${siteName}. Your account is now active.

Next steps:
- Complete your profile
- Top up wallet or use free credits
- Send your first SMS campaign

Open dashboard: ${dashboardUrl}

— ${siteName}`;

  const html = await renderEmailLayout({
    headline: `Welcome to ${siteName}`,
    preheader: "Your account is active.",
    greeting: `Hi ${firstName},`,
    bodyHtml: textToEmailParagraphs(
      "Your account is now active.\n\nYou can complete your profile, top up your wallet, and send your first SMS campaign from your dashboard.",
    ),
    ctaHref: dashboardUrl,
    ctaLabel: "Open dashboard",
    footerNote: "If this wasn't you, contact support immediately.",
  });

  return { subject, text, html };
}

export async function passwordResetSuccessEmailContent(params: {
  memberName: string;
  changedAt?: Date;
  supportUrl?: string;
}) {
  const firstName = params.memberName.trim().split(/\s+/)[0] || "there";
  const changedAt = params.changedAt ?? new Date();
  const changedAtText = changedAt.toUTCString();
  const supportUrl = params.supportUrl ?? `${getSiteUrl()}/support`;
  const loginUrl = `${getSiteUrl()}/login`;
  const subject = `${siteName}: Your password was changed`;
  const text = `Hi ${firstName},

Your ${siteName} password was successfully changed on ${changedAtText}.

If you didn't make this change, contact support immediately:
${supportUrl}

Sign in: ${loginUrl}

— ${siteName}`;

  const html = await renderEmailLayout({
    eyebrow: "Account security",
    headline: "Your password was changed",
    preheader: "Your password change was completed successfully.",
    greeting: `Hi ${firstName},`,
    bodyHtml: `${textToEmailParagraphs(
      `Your ${siteName} password was successfully changed.`,
    )}${emailDetailTable([
      { label: "Changed", value: changedAtText },
      { label: "Account", value: params.memberName },
    ])}<p style="margin:0 0 14px;font-size:14px;line-height:1.65;color:#3f3f46;">If you didn't make this change, <a href="${escapeHtml(
      supportUrl,
    )}" style="color:#c2410c;font-weight:600;">contact support immediately</a>.</p>`,
    ctaHref: loginUrl,
    ctaLabel: "Sign in to your account",
    footerNote: "For your security, this email does not contain your password.",
  });

  return { subject, text, html };
}

export async function lowCreditBalanceEmailContent(params: {
  memberName: string;
  balance: number;
  threshold?: number;
  topupUrl?: string;
}) {
  const firstName = params.memberName.trim().split(/\s+/)[0] || "there";
  const threshold = params.threshold ?? 10;
  const topupUrl = params.topupUrl ?? `${getSiteUrl()}/dashboard/wallet`;
  const subject = `${siteName}: Low SMS credit balance`;
  const text = `Hi ${firstName},

Your SMS credit balance is low: ${params.balance} credits remaining.

Top up now to avoid failed message delivery.
Top up wallet: ${topupUrl}

Low-balance threshold: ${threshold} credits.

— ${siteName}`;

  const html = await renderEmailLayout({
    headline: "Low SMS credit balance",
    preheader: `${params.balance} credits remaining`,
    greeting: `Hi ${firstName},`,
    bodyHtml: `${textToEmailParagraphs(
      "Your SMS credit balance is running low. Top up now to avoid failed message delivery.",
    )}${emailDetailTable([
      { label: "Credits remaining", value: String(params.balance) },
      { label: "Alert threshold", value: `${threshold} credits` },
    ])}`,
    ctaHref: topupUrl,
    ctaLabel: "Top up wallet",
  });

  return { subject, text, html };
}

export async function senderIdAdminAlertContent(params: {
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

  const rows = [
    { label: "Sender ID", value: params.value, mono: true },
    { label: "Country", value: params.countryCode },
    { label: "Member", value: params.memberName },
    { label: "Phone", value: params.memberPhone, mono: true },
  ];
  if (params.memberEmail) {
    rows.push({ label: "Email", value: params.memberEmail, mono: true });
  }

  const html = await renderEmailLayout({
    headline: "New sender ID request",
    preheader: `${params.value} · ${params.memberName}`,
    bodyHtml: `${textToEmailParagraphs(
      "A member requested a new sender ID. Review and approve it in Admin → Sender IDs before it is submitted to carriers.",
    )}${emailDetailTable(rows)}`,
    ctaHref: `${getSiteUrl()}/admin/sender-ids?tab=pending`,
    ctaLabel: "Review sender IDs",
  });

  return { subject, text, html };
}

export async function senderIdApprovedMemberContent(params: {
  value: string;
  memberName: string;
}) {
  const subject = `Sender ID approved: ${params.value}`;
  const text = `Hi ${params.memberName},

Your sender ID "${params.value}" is now approved on ${siteName} and ready to use when sending SMS.

— ${siteName}`;

  const html = await renderEmailLayout({
    headline: "Sender ID approved",
    preheader: `${params.value} is ready to use`,
    greeting: `Hi ${params.memberName},`,
    bodyHtml: `${textToEmailParagraphs(
      "Your sender ID is now approved and ready to use when sending SMS.",
    )}${emailDetailTable([{ label: "Sender ID", value: params.value, mono: true }])}`,
    ctaHref: `${getSiteUrl()}/dashboard/sender-ids`,
    ctaLabel: "Manage sender IDs",
  });

  return { subject, text, html };
}

export async function senderIdLiveMemberContent(params: {
  value: string;
  memberName: string;
}) {
  const subject = `Your sender ID is live: ${params.value}`;
  const text = `Hi ${params.memberName},

Great news — your sender ID "${params.value}" is live on ${siteName} now.

You can start sending SMS with this sender ID right away.

— ${siteName}`;

  const html = await renderEmailLayout({
    headline: "Your sender ID is live",
    preheader: `${params.value} is live — start sending SMS`,
    greeting: `Hi ${params.memberName},`,
    bodyHtml: `${textToEmailParagraphs(
      `Great news — your sender ID is live on ${siteName} now. You can start sending SMS with this sender ID right away.`,
    )}${emailDetailTable([{ label: "Sender ID", value: params.value, mono: true }])}`,
    ctaHref: `${getSiteUrl()}/dashboard/send`,
    ctaLabel: "Send SMS",
  });

  return { subject, text, html };
}

export async function adminMemberOutreachEmailContent(params: {
  memberName: string;
  subject: string;
  bodyText: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  const subject = params.subject;
  const bodyText = stripSignatureFooter(params.bodyText);
  const firstName = params.memberName.trim().split(/\s+/)[0] || "there";
  const ctaText =
    params.ctaHref && params.ctaLabel ? `\n\n${params.ctaLabel}: ${params.ctaHref}` : "";

  const text = `Hi ${firstName},\n\n${bodyText}${ctaText}`;

  const html = await renderEmailLayout({
    headline: params.subject,
    preheader: bodyText.split("\n").find((line) => line.trim()) ?? params.subject,
    greeting: `Hi ${firstName},`,
    bodyHtml: textToEmailParagraphs(bodyText),
    ctaHref: params.ctaHref,
    ctaLabel: params.ctaLabel,
    footerNote: "You are receiving this because you have an account with us.",
  });

  return { subject, text, html };
}

export async function senderIdSubmittedMemberContent(params: {
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

  const html = await renderEmailLayout({
    headline: "Sender ID submitted",
    preheader: `${params.value} is pending carrier registration`,
    greeting: `Hi ${params.memberName},`,
    bodyHtml: `${textToEmailParagraphs(
      "Your sender ID has been submitted to our SMS carriers for registration. We'll notify you when it is approved and ready for sending.",
    )}${emailDetailTable([
      { label: "Sender ID", value: params.value, mono: true },
      { label: "Purpose", value: params.purpose },
      { label: "Status", value: "Pending registration" },
    ])}`,
    ctaHref: `${getSiteUrl()}/dashboard/sender-ids`,
    ctaLabel: "View sender IDs",
    footerNote: "You cannot use this sender ID for SMS until carrier registration completes.",
  });

  return { subject, text, html };
}

export async function senderIdRejectedMemberContent(params: {
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

  const html = await renderEmailLayout({
    headline: "Sender ID not approved",
    preheader: `${params.value} was not approved`,
    greeting: `Hi ${params.memberName},`,
    bodyHtml: `${textToEmailParagraphs(
      "Your sender ID request was not approved. You may register a different sender ID that meets carrier naming rules.",
    )}${emailDetailTable([
      { label: "Sender ID", value: params.value, mono: true },
      { label: "Reason", value: params.reason },
    ])}`,
    ctaHref: registerUrl,
    ctaLabel: "Register a sender ID",
  });

  return { subject, text, html };
}

export type ReceiptEmailKind = "wallet_topup" | "credit_purchase";

export async function receiptEmailContent(params: {
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
    ? `Your wallet was credited with ${amountLine}.`
    : `You purchased ${params.credits?.toLocaleString() ?? "—"} SMS credits for ${amountLine}.`;

  const detailRows: { label: string; value: string; mono?: boolean }[] = [
    { label: "Receipt", value: params.receiptNo, mono: true },
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
    detailRows.push({
      label: "Credit balance",
      value: params.creditsAfter.toLocaleString(),
    });
  }

  const textDetails = detailRows.map((r) => `${r.label}: ${r.value}`).join("\n");

  const text = `Hi ${params.memberName},

${summary}

${textDetails}

View your invoices: ${params.invoicesUrl}

— ${siteName}`;

  const html = await renderEmailLayout({
    headline: title,
    preheader: `${amountLine} · ${params.receiptNo}`,
    greeting: `Hi ${params.memberName},`,
    bodyHtml: `${textToEmailParagraphs(summary)}${emailDetailTable(detailRows)}`,
    ctaHref: params.invoicesUrl,
    ctaLabel: "View invoices",
    footerNote: `Thank you for using ${siteName}.`,
  });

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

export async function supportTicketCreatedMemberContent(params: {
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

  const html = await renderEmailLayout({
    headline: "Support request received",
    preheader: `${params.ticketRef} · ${params.subject}`,
    greeting: `Hi ${params.memberName},`,
    bodyHtml: `${textToEmailParagraphs(
      "We received your support request. We'll reply by email or SMS.",
    )}${emailDetailTable([
      { label: "Ticket", value: params.ticketRef, mono: true },
      { label: "Subject", value: params.subject },
    ])}${emailQuote(preview)}`,
    ctaHref: params.supportUrl,
    ctaLabel: `View ticket ${params.ticketRef}`,
  });

  return { subject, text, html };
}

export async function supportTicketReplyMemberContent(params: {
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

  const html = await renderEmailLayout({
    headline: "New support reply",
    preheader: `Reply on ${params.ticketRef}`,
    greeting: `Hi ${params.memberName},`,
    bodyHtml: `${textToEmailParagraphs(
      `Our team replied to "${params.subject}".`,
    )}${emailDetailTable([
      { label: "Ticket", value: params.ticketRef, mono: true },
    ])}${emailQuote(params.replyBody)}`,
    ctaHref: params.supportUrl,
    ctaLabel: `Open ticket ${params.ticketRef}`,
  });

  return { subject, text, html };
}

export async function supportTicketStatusMemberContent(params: {
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

  const html = await renderEmailLayout({
    headline: "Support ticket updated",
    preheader: `${params.ticketRef} is ${statusLabel.toLowerCase()}`,
    greeting: `Hi ${params.memberName},`,
    bodyHtml: `${textToEmailParagraphs(
      "Your support ticket status has been updated.",
    )}${emailDetailTable([
      { label: "Ticket", value: params.ticketRef, mono: true },
      { label: "Subject", value: params.subject },
      { label: "Status", value: statusLabel },
    ])}<p style="margin:0 0 8px;font-size:14px;color:#3f3f46;">Current status: ${emailStatusPill(statusLabel)}</p>`,
    ctaHref: params.supportUrl,
    ctaLabel: `Open ticket ${params.ticketRef}`,
  });

  return { subject, text, html };
}

export async function supportTicketAdminAlertContent(params: {
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

  const rows = [
    { label: "Ticket", value: params.ticketRef, mono: true },
    { label: "Subject", value: params.subject },
    { label: "Member", value: params.memberName },
    { label: "Phone", value: params.memberPhone, mono: true },
  ];
  if (params.memberEmail) {
    rows.push({ label: "Email", value: params.memberEmail, mono: true });
  }

  const html = await renderEmailLayout({
    headline: "New support ticket",
    preheader: `${params.ticketRef} · ${params.subject}`,
    bodyHtml: `${textToEmailParagraphs(
      "A member opened a new support ticket that needs review.",
    )}${emailDetailTable(rows)}${emailQuote(preview)}`,
    ctaHref: params.adminUrl,
    ctaLabel: "Open in admin",
  });

  return { subject, text, html };
}

export async function adminBalanceAlertEmailContent(params: {
  title: string;
  summary: string;
  display: string;
  action: string;
  adminUrl: string;
}) {
  const subject = `${siteName}: ${params.title}`;
  const text = [
    params.summary,
    "",
    `Current: ${params.display}`,
    `Action: ${params.action}`,
    "",
    `Open admin: ${params.adminUrl}`,
  ].join("\n");

  const html = await renderEmailLayout({
    headline: params.title,
    preheader: params.display,
    bodyHtml: `${textToEmailParagraphs(params.summary)}${emailDetailTable([
      { label: "Current", value: params.display },
      { label: "Action", value: params.action },
    ])}`,
    ctaHref: params.adminUrl,
    ctaLabel: "Open admin",
    footerNote: "This alert was generated from provider balance monitoring.",
  });

  return { subject, text, html };
}
