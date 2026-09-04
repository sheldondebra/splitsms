import {
  emailCodeBlock,
  emailDetailTable,
  emailNumberedList,
  emailQuote,
  emailSectionHeading,
  emailStatusPill,
  escapeHtml,
  stripSignatureFooter,
  textToEmailParagraphs,
} from "@/lib/email/layout";
import { renderEmailLayout } from "@/lib/email/render";
import { getSiteUrl, siteName } from "@/lib/site-config";
import {
  buildAccountReportEmailCopy,
  type AccountReportEmailParams,
} from "@/lib/reports/account-report-email";
import { buildSmartFormReportEmailCopy } from "@/lib/smart-forms/report-email";
import type { SmartFormReport } from "@/lib/smart-forms/report";

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
  email?: string | null;
  dashboardUrl?: string;
  loginUrl?: string;
}) {
  const firstName = params.memberName.trim().split(/\s+/)[0] || "there";
  const dashboardUrl = params.dashboardUrl ?? `${getSiteUrl()}/dashboard`;
  const loginUrl = params.loginUrl ?? `${getSiteUrl()}/login`;
  const forgotUrl = `${getSiteUrl()}/forgot-password`;
  const smartFormsUrl = `${getSiteUrl()}/dashboard/forms`;
  const loginId = params.email?.trim() || "the email you signed up with";
  const subject = `Welcome to ${siteName}`;
  const text = `Hi ${firstName},

Your ${siteName} account is ready.

Sign in
${loginUrl}
Email: ${loginId}
Password: the one you chose at signup
Forgot password: ${forgotUrl}

Get started
1. Sign in and open your dashboard
2. Request a Sender ID for branded SMS
3. Top up your wallet
4. Send a test SMS
5. Create a Smart Form to capture leads and send SMS automatically

Smart Forms collect names, phones, and replies on a hosted form, then send SMS from your account. Start here: ${smartFormsUrl}

Open dashboard: ${dashboardUrl}

If you did not create this account, ignore this email.`;

  const html = await renderEmailLayout({
    headline: `Welcome to ${siteName}`,
    preheader: "Your account is ready. Here is how to sign in and send your first SMS.",
    greeting: `Hi ${firstName},`,
    bodyHtml: `${textToEmailParagraphs(
      `Your account is ready. Sign in with this email and the password you chose at signup.`,
    )}${emailDetailTable([
      { label: "Sign-in URL", value: loginUrl, mono: true },
      { label: "Email", value: loginId, mono: true },
      { label: "Password", value: "The one you chose at signup" },
    ])}${emailSectionHeading("Get started")}${emailNumberedList([
      "Sign in and open your dashboard",
      "Request a Sender ID so messages show your brand name",
      "Top up your wallet",
      "Send a test SMS",
      "Create a Smart Form to capture leads and send SMS automatically",
    ])}${textToEmailParagraphs(
      `Smart Forms are hosted forms that collect names, phone numbers, and replies, then send SMS from your ${siteName} account. Use them for registrations, OTP, and follow-ups without writing code.`,
    )}<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#444444;">Need to reset your password? <a href="${escapeHtml(
      forgotUrl,
    )}" style="color:#111111;font-weight:600;">${escapeHtml(forgotUrl)}</a></p>`,
    ctaHref: dashboardUrl,
    ctaLabel: "Open dashboard",
  });

  return { subject, text, html };
}

export async function failedSignInHelpEmailContent(params: {
  memberName: string;
  email: string;
}) {
  const firstName = params.memberName.trim().split(/\s+/)[0] || "there";
  const loginUrl = `${getSiteUrl()}/login`;
  const forgotUrl = `${getSiteUrl()}/forgot-password`;
  const subject = `${siteName}: Sign-in help`;
  const text = `Hi ${firstName},

We saw two failed sign-in attempts on your ${siteName} account.

Sign in: ${loginUrl}
Email: ${params.email}
Reset password: ${forgotUrl}

If this was you, use the reset link above and try again. If it was not you, change your password.

We never send your password by email.`;

  const html = await renderEmailLayout({
    headline: "Sign-in help",
    preheader: "Two failed sign-in attempts. Reset your password if you need to.",
    greeting: `Hi ${firstName},`,
    bodyHtml: `${textToEmailParagraphs(
      "We saw two failed sign-in attempts on your account. Use the details below, or reset your password.",
    )}${emailDetailTable([
      { label: "Sign-in URL", value: loginUrl, mono: true },
      { label: "Email", value: params.email, mono: true },
    ])}<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#444444;">Forgot your password? <a href="${escapeHtml(
      forgotUrl,
    )}" style="color:#111111;font-weight:600;">Reset it here</a>.</p>${textToEmailParagraphs(
      "We never send your password by email. If this was not you, reset your password now.",
    )}`,
    ctaHref: forgotUrl,
    ctaLabel: "Reset password",
  });

  return { subject, text, html };
}

export async function inactiveMemberNudgeEmailContent(params: {
  memberName: string;
}) {
  const firstName = params.memberName.trim().split(/\s+/)[0] || "there";
  const dashboardUrl = `${getSiteUrl()}/dashboard`;
  const loginUrl = `${getSiteUrl()}/login`;
  const subject = `${siteName}: Your account is ready when you are`;
  const text = `Hi ${firstName},

You have not signed in to ${siteName} for a while. Your Sender IDs, contacts, and wallet are still here.

Sign in: ${loginUrl}

From the dashboard you can send SMS, top up credits, and use Smart Forms to collect leads.

${dashboardUrl}`;

  const html = await renderEmailLayout({
    headline: "Your account is still here",
    preheader: "Sign in to send SMS, top up your wallet, or try Smart Forms.",
    greeting: `Hi ${firstName},`,
    bodyHtml: `${textToEmailParagraphs(
      `You have not signed in to ${siteName} for a while. Your Sender IDs, contacts, and wallet are still here.\n\nSign in to send SMS, top up credits, or create a Smart Form that captures leads and sends follow-up messages.`,
    )}`,
    ctaHref: dashboardUrl,
    ctaLabel: "Open dashboard",
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
    )}" style="color:#111111;font-weight:600;">contact support immediately</a>.</p>`,
    ctaHref: loginUrl,
    ctaLabel: "Sign in to your account",
    footerNote: "For your security, this email does not contain your password.",
  });

  return { subject, text, html };
}

/** Admin-initiated email with a secure reset link + login details. */
export async function passwordResetLinkEmailContent(params: {
  memberName: string;
  memberId: string;
  email: string;
  phone: string;
  resetUrl: string;
  loginUrl?: string;
}) {
  const firstName = params.memberName.trim().split(/\s+/)[0] || "there";
  const loginUrl = params.loginUrl ?? `${getSiteUrl()}/login`;
  const subject = `${siteName}: Reset your password`;
  const text = `Hi ${firstName},

An admin sent you a password reset link for your ${siteName} account.

Username: ${params.memberName}
Member ID: ${params.memberId}
Email: ${params.email}
Phone: ${params.phone}

Reset your password:
${params.resetUrl}

After you finish, sign in here:
${loginUrl}

This link expires in 1 hour. If you didn't expect this, contact support.

— ${siteName}`;

  const html = await renderEmailLayout({
    eyebrow: "Account security",
    headline: "Reset your password",
    preheader: `Reset your ${siteName} password, then sign in.`,
    greeting: `Hi ${firstName},`,
    bodyHtml: `${textToEmailParagraphs(
      `An admin sent you a password reset link for your ${siteName} account. Use the button below, then sign in with your email or phone.`,
    )}${emailDetailTable([
      { label: "Username", value: params.memberName },
      { label: "Member ID", value: params.memberId, mono: true },
      { label: "Email", value: params.email, mono: true },
      { label: "Phone", value: params.phone, mono: true },
      { label: "Login URL", value: loginUrl, mono: true },
    ])}<p style="margin:0 0 14px;font-size:14px;line-height:1.65;color:#3f3f46;">After you reset, sign in here: <a href="${escapeHtml(
      loginUrl,
    )}" style="color:#111111;font-weight:600;">${escapeHtml(loginUrl)}</a></p>`,
    ctaHref: params.resetUrl,
    ctaLabel: "Reset password",
    footerNote: `Login CTA: Sign in at ${loginUrl} after resetting. This link expires in 1 hour.`,
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

export async function deliveryFailureNoticeEmailContent(params: {
  memberName: string;
  failedCount: number;
  reason: string;
  periodDays: number;
  lastFailedAt?: string;
  reportsUrl?: string;
}) {
  const firstName = params.memberName.trim().split(/\s+/)[0] || "there";
  const reportsUrl = params.reportsUrl ?? `${getSiteUrl()}/dashboard/account-reports/delivery`;
  const subject = `${siteName}: ${params.failedCount} SMS failed — delivery notice`;
  const whenLine = params.lastFailedAt ? `\nLast failed: ${params.lastFailedAt}` : "";
  const text = `Hi ${firstName},

We wanted to let you know that ${params.failedCount.toLocaleString()} SMS message${
    params.failedCount === 1 ? "" : "s"
  } from your ${siteName} account failed delivery in the last ${params.periodDays} days.

Reason: ${params.reason}${whenLine}

You can review delivery details here: ${reportsUrl}

If you need help fixing this (Sender ID approval, credits, or routing), reply to this email or open Support in your dashboard.

— ${siteName}`;

  const html = await renderEmailLayout({
    eyebrow: "Delivery",
    headline: "SMS delivery failed",
    preheader: `${params.failedCount} message${params.failedCount === 1 ? "" : "s"} failed`,
    greeting: `Hi ${firstName},`,
    bodyHtml: `${textToEmailParagraphs(
      `${params.failedCount.toLocaleString()} SMS message${
        params.failedCount === 1 ? "" : "s"
      } from your account failed delivery in the last ${params.periodDays} days.`,
    )}${emailDetailTable([
      { label: "Failed messages", value: params.failedCount.toLocaleString() },
      { label: "Reason", value: params.reason },
      ...(params.lastFailedAt
        ? [{ label: "Last failed", value: params.lastFailedAt }]
        : []),
      { label: "Period", value: `Last ${params.periodDays} days` },
    ])}`,
    ctaHref: reportsUrl,
    ctaLabel: "View delivery report",
    footerNote: "Need help? Open Support in your dashboard or reply to this email.",
  });

  return { subject, text, html };
}

export async function accountReportEmailContent(params: AccountReportEmailParams) {
  const copy = buildAccountReportEmailCopy(params);
  const html = await renderEmailLayout({
    eyebrow: "Statement",
    headline: copy.headline,
    preheader: copy.preheader,
    greeting: copy.greeting,
    bodyHtml: copy.bodyHtml,
    ctaHref: copy.ctaHref,
    ctaLabel: copy.ctaLabel,
    footerNote: copy.footerNote,
  });

  return { subject: copy.subject, text: copy.text, html };
}

export async function smartFormReportEmailContent(params: {
  report: SmartFormReport;
  reportsUrl: string;
  generatedAt?: Date;
  note?: string;
}) {
  const copy = buildSmartFormReportEmailCopy(params);
  const html = await renderEmailLayout({
    eyebrow: "Smart Form",
    headline: copy.headline,
    preheader: copy.preheader,
    greeting: copy.greeting,
    bodyHtml: copy.bodyHtml,
    ctaHref: copy.ctaHref,
    ctaLabel: copy.ctaLabel,
    footerNote: copy.footerNote,
  });

  return { subject: copy.subject, text: copy.text, html };
}

export async function insufficientCreditsRetryEmailContent(params: {
  memberName: string;
  balance: number;
  messagesBlocked: number;
  creditsNeeded: number;
  topupUrl?: string;
}) {
  const firstName = params.memberName.trim().split(/\s+/)[0] || "there";
  const topupUrl = params.topupUrl ?? `${getSiteUrl()}/dashboard/wallet`;
  const subject = `${siteName}: Top up SMS credits to resend failed messages`;
  const text = `Hi ${firstName},

Retry blocked — your account does not have enough SMS credits for a re-send.

Failed messages waiting: ${params.messagesBlocked.toLocaleString()}
Credits needed: ${params.creditsNeeded.toLocaleString()}
Current balance: ${params.balance.toLocaleString()} credits

Top up your wallet and buy credits, then try sending again.
Top up: ${topupUrl}

— ${siteName}`;

  const html = await renderEmailLayout({
    eyebrow: "Billing",
    headline: "Not enough SMS credits",
    preheader: `${params.messagesBlocked} message${params.messagesBlocked === 1 ? "" : "s"} waiting to resend`,
    greeting: `Hi ${firstName},`,
    bodyHtml: `${textToEmailParagraphs(
      "Retry blocked — your account does not have enough SMS credits for a re-send. Top up your credits so failed messages can be delivered.",
    )}${emailDetailTable([
      { label: "Messages waiting", value: params.messagesBlocked.toLocaleString() },
      { label: "Credits needed", value: params.creditsNeeded.toLocaleString() },
      { label: "Current balance", value: `${params.balance.toLocaleString()} credits` },
    ])}`,
    ctaHref: topupUrl,
    ctaLabel: "Top up wallet",
  });

  return { subject, text, html };
}

export async function failedMessagesRetryEmailContent(params: {
  memberName: string;
  messageCount: number;
  dashboardUrl?: string;
}) {
  const firstName = params.memberName.trim().split(/\s+/)[0] || "there";
  const dashboardUrl = params.dashboardUrl ?? `${getSiteUrl()}/dashboard/reports`;
  const subject = `${siteName}: Failed messages are being resent`;
  const text = `Hi ${firstName},

We re-queued ${params.messageCount.toLocaleString()} failed message${
    params.messageCount === 1 ? "" : "s"
  } for delivery from your ${siteName} account.

Track delivery: ${dashboardUrl}

— ${siteName}`;

  const html = await renderEmailLayout({
    eyebrow: "Delivery",
    headline: "Messages being resent",
    preheader: `${params.messageCount} message${params.messageCount === 1 ? "" : "s"} re-queued`,
    greeting: `Hi ${firstName},`,
    bodyHtml: `${textToEmailParagraphs(
      `We re-queued ${params.messageCount.toLocaleString()} failed message${
        params.messageCount === 1 ? "" : "s"
      } for delivery from your account.`,
    )}`,
    ctaHref: dashboardUrl,
    ctaLabel: "View delivery reports",
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

/** Notify a member that their account was suspended by an admin. */
export async function accountSuspendedEmailContent(params: {
  memberName: string;
  memberId: string;
  reasons: string[];
  note?: string;
  supportUrl?: string;
}) {
  const firstName = params.memberName.trim().split(/\s+/)[0] || "there";
  const supportUrl = params.supportUrl ?? `${getSiteUrl()}/support`;
  const loginUrl = `${getSiteUrl()}/login`;
  const reasonsText = params.reasons.length
    ? params.reasons.map((r) => `• ${r}`).join("\n")
    : "• Account restricted by administrator";
  const noteBlock = params.note?.trim()
    ? `\nAdditional details:\n${params.note.trim()}\n`
    : "";

  const subject = `${siteName}: Your account has been suspended`;
  const text = `Hi ${firstName},

Your ${siteName} account has been suspended and you can no longer sign in.

Member ID: ${params.memberId}

Reason(s):
${reasonsText}
${noteBlock}
If you believe this was a mistake, contact support:
${supportUrl}

— ${siteName}`;

  const html = await renderEmailLayout({
    eyebrow: "Account security",
    headline: "Your account has been suspended",
    preheader: `Your ${siteName} account access has been restricted.`,
    greeting: `Hi ${firstName},`,
    bodyHtml: `${textToEmailParagraphs(
      `Your ${siteName} account has been suspended and you can no longer sign in.`,
    )}${emailDetailTable([
      { label: "Member ID", value: params.memberId, mono: true },
      { label: "Username", value: params.memberName },
      {
        label: "Reason(s)",
        value: params.reasons.length ? params.reasons.join(", ") : "Restricted by administrator",
      },
      ...(params.note?.trim()
        ? [{ label: "Details", value: params.note.trim() }]
        : []),
    ])}<p style="margin:0 0 14px;font-size:14px;line-height:1.65;color:#3f3f46;">If you believe this was a mistake, <a href="${escapeHtml(
      supportUrl,
    )}" style="color:#111111;font-weight:600;">contact support</a>.</p>`,
    ctaHref: supportUrl,
    ctaLabel: "Contact support",
    footerNote: `Login is disabled at ${loginUrl} while suspended.`,
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

const SENDER_ID_DOC_TYPE_LABEL: Record<
  "BUSINESS_REGISTRATION" | "PASSPORT" | "GHANA_CARD" | "OTHER_ID",
  string
> = {
  BUSINESS_REGISTRATION: "Business registration document",
  PASSPORT: "Passport",
  GHANA_CARD: "Ghana Card",
  OTHER_ID: "Government ID",
};

export function senderIdDocumentTypeLabel(
  docType: "BUSINESS_REGISTRATION" | "PASSPORT" | "GHANA_CARD" | "OTHER_ID",
) {
  return SENDER_ID_DOC_TYPE_LABEL[docType] ?? "Document";
}

/** Ask a member to upload a verification document (hold or not-approved). */
export async function senderIdDocumentRequestMemberContent(params: {
  value: string;
  memberName: string;
  reason: string;
  uploadUrl: string;
}) {
  const subject = `Action needed: verify sender ID ${params.value}`;
  const text = `Hi ${params.memberName},

Your sender ID "${params.value}" needs a quick verification step before it can go live.

${params.reason}

Upload a business registration document, or a Passport / Ghana Card, and we'll review it:
${params.uploadUrl}

This link expires in 7 days.

— ${siteName}`;

  const html = await renderEmailLayout({
    headline: "Verify your sender ID",
    preheader: `${params.value} needs a document to continue`,
    greeting: `Hi ${params.memberName},`,
    bodyHtml: `${textToEmailParagraphs(
      `${params.reason} Upload a business registration document, or a Passport / Ghana Card, and we'll review it.`,
    )}${emailDetailTable([{ label: "Sender ID", value: params.value, mono: true }])}`,
    ctaHref: params.uploadUrl,
    ctaLabel: "Upload document",
    footerNote: "This link expires in 7 days.",
  });

  return { subject, text, html };
}

/** Confirm to the member that their verification document was received. */
export async function senderIdDocumentUploadedMemberContent(params: {
  value: string;
  memberName: string;
  docType: "BUSINESS_REGISTRATION" | "PASSPORT" | "GHANA_CARD" | "OTHER_ID";
}) {
  const docLabel = senderIdDocumentTypeLabel(params.docType);
  const subject = `We received your document for ${params.value}`;
  const text = `Hi ${params.memberName},

Thanks — we received your ${docLabel.toLowerCase()} for sender ID "${params.value}".

Your sender ID is pending approval while our team reviews it. We'll email you as soon as it's decided.

— ${siteName}`;

  const html = await renderEmailLayout({
    headline: "Document received",
    preheader: `${params.value} is pending approval`,
    greeting: `Hi ${params.memberName},`,
    bodyHtml: `${textToEmailParagraphs(
      "Thanks — we received your document. Your sender ID is pending approval while our team reviews it. We'll email you as soon as it's decided.",
    )}${emailDetailTable([
      { label: "Sender ID", value: params.value, mono: true },
      { label: "Document", value: docLabel },
      { label: "Status", value: "Pending approval" },
    ])}`,
    ctaHref: `${getSiteUrl()}/dashboard/sender-ids`,
    ctaLabel: "View sender IDs",
  });

  return { subject, text, html };
}

/** Alert admins that a member uploaded a verification document. */
export async function senderIdDocumentUploadedAdminAlertContent(params: {
  value: string;
  memberName: string;
  memberPhone: string;
  memberEmail?: string | null;
  docType: "BUSINESS_REGISTRATION" | "PASSPORT" | "GHANA_CARD" | "OTHER_ID";
  adminUrl: string;
}) {
  const docLabel = senderIdDocumentTypeLabel(params.docType);
  const subject = `Document uploaded for sender ID: ${params.value}`;
  const text = `A member uploaded a verification document on ${siteName}.

Sender ID: ${params.value}
Document: ${docLabel}
Member: ${params.memberName}
Phone: ${params.memberPhone}
${params.memberEmail ? `Email: ${params.memberEmail}` : ""}

Review and download it here:
${params.adminUrl}

— ${siteName}`;

  const rows = [
    { label: "Sender ID", value: params.value, mono: true },
    { label: "Document", value: docLabel },
    { label: "Member", value: params.memberName },
    { label: "Phone", value: params.memberPhone, mono: true },
  ];
  if (params.memberEmail) {
    rows.push({ label: "Email", value: params.memberEmail, mono: true });
  }

  const html = await renderEmailLayout({
    headline: "Verification document uploaded",
    preheader: `${params.value} · ${docLabel}`,
    bodyHtml: `${textToEmailParagraphs(
      "A member uploaded a verification document. Review and download it in Admin → Sender IDs.",
    )}${emailDetailTable(rows)}`,
    ctaHref: params.adminUrl,
    ctaLabel: "Review document",
  });

  return { subject, text, html };
}

/** A backup job finished building and is ready to download. */
export async function backupReadyEmailContent(params: {
  categories: string[];
  sizeBytes: number;
  downloadUrl: string;
  attached: boolean;
}) {
  const sizeLabel =
    params.sizeBytes > 1024 * 1024
      ? `${(params.sizeBytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.max(1, Math.round(params.sizeBytes / 1024))} KB`;
  const subject = `Your ${siteName} backup is ready`;
  const attachedLine = params.attached
    ? "The backup zip is attached to this email. If your email client blocks it, you can also download it with the link below (signed-in admins only)."
    : "This backup was too large to attach here — download it with the secure link below (signed-in admins only).";
  const text = `Your backup finished building on ${siteName}.

Categories: ${params.categories.join(", ")}
Size: ${sizeLabel}

${attachedLine}
${params.downloadUrl}

— ${siteName}`;

  const rows = [
    { label: "Categories", value: params.categories.join(", ") },
    { label: "Size", value: sizeLabel },
  ];

  const html = await renderEmailLayout({
    headline: "Your backup is ready",
    preheader: `${sizeLabel} · ${params.categories.length} categories`,
    bodyHtml: `${textToEmailParagraphs(attachedLine)}${emailDetailTable(rows)}`,
    ctaHref: params.downloadUrl,
    ctaLabel: "Download backup",
  });

  return { subject, text, html };
}

/** Admin credited or debited wallet / SMS credits. */
export async function adminBalanceAdjustmentEmailContent(params: {
  memberName: string;
  kind: "wallet" | "credits";
  delta: number;
  currency: string;
  balanceAfter: number;
  packageName?: string;
  note?: string;
  dashboardUrl?: string;
}) {
  const firstName = params.memberName.trim().split(/\s+/)[0] || "there";
  const dashboardUrl = params.dashboardUrl ?? `${getSiteUrl()}/dashboard/wallet`;
  const isCredit = params.delta > 0;
  const abs = Math.abs(params.delta);
  const amountLabel =
    params.kind === "wallet"
      ? `${params.currency} ${abs.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : `${abs.toLocaleString()} SMS credits`;
  const action = isCredit ? "credited" : "debited";
  const subject = `${siteName}: Your ${params.kind === "wallet" ? "wallet" : "SMS credits"} were ${action}`;
  const packageLine = params.packageName ? `\nPackage: ${params.packageName}` : "";
  const noteLine = params.note?.trim() ? `\nNote: ${params.note.trim()}` : "";
  const balanceLabel =
    params.kind === "wallet"
      ? `${params.currency} ${params.balanceAfter.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : `${params.balanceAfter.toLocaleString()} credits`;

  const text = `Hi ${firstName},

Your ${siteName} ${params.kind === "wallet" ? "wallet" : "SMS credit balance"} was ${action} by an administrator.

Amount: ${isCredit ? "+" : "−"}${amountLabel}${packageLine}${noteLine}
New balance: ${balanceLabel}

Open your wallet: ${dashboardUrl}

— ${siteName}`;

  const html = await renderEmailLayout({
    eyebrow: "Billing",
    headline: isCredit ? "Balance credited" : "Balance adjusted",
    preheader: `${isCredit ? "+" : "−"}${amountLabel}`,
    greeting: `Hi ${firstName},`,
    bodyHtml: `${textToEmailParagraphs(
      `Your ${params.kind === "wallet" ? "wallet" : "SMS credit balance"} was ${action} by an administrator.`,
    )}${emailDetailTable([
      { label: "Amount", value: `${isCredit ? "+" : "−"}${amountLabel}` },
      ...(params.packageName
        ? [{ label: "Package", value: params.packageName }]
        : []),
      ...(params.note?.trim()
        ? [{ label: "Note", value: params.note.trim() }]
        : []),
      { label: "New balance", value: balanceLabel },
    ])}`,
    ctaHref: dashboardUrl,
    ctaLabel: "Open wallet",
    footerNote: `If you did not expect this change, contact support.`,
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
