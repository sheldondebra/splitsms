"use server";

import { prisma } from "@/lib/db";
import { getRealSession as getSession, isAdminRole } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { createAndSendOtp } from "@/lib/auth/otp";
import { logAuthEvent } from "@/lib/auth/audit";
import {
  approveSenderIdCore,
  rejectSenderIdCore,
} from "@/lib/actions/admin-sender-ids";
import { getOrCreateMemberAccount } from "@/lib/admin/member-account";
import { syncSenderIdFromProviders } from "@/lib/sender-ids/provider-sync";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { MemberAccountStatus, SmsProviderType } from "@/lib/generated/prisma/client";
import { randomBytes } from "crypto";

function memberPath(userId: string, query?: Record<string, string>) {
  const q = query ? `?${new URLSearchParams(query).toString()}` : "";
  return `/admin/members/${userId}${q}`;
}

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");
  return session;
}

async function logAdmin(action: string, userId: string, adminId: string, metadata?: object) {
  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      action,
      entityType: "User",
      entityId: userId,
      metadata: metadata ?? {},
    },
  });
}

export async function adminAdjustSmsCreditsAction(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("userId"));
  const amount = Number(formData.get("amount"));
  const note = String(formData.get("note") ?? "").trim();
  const packageId = String(formData.get("packageId") ?? "").trim();
  const packageName = String(formData.get("packageName") ?? "").trim();
  const notify = formData.get("notify") !== "0";

  if (!userId || !Number.isFinite(amount) || amount === 0) {
    redirect(memberPath(userId, { tab: "billing", error: "credits" }));
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, role: "MEMBER" },
    select: { id: true, fullName: true, email: true },
  });
  if (!user) redirect("/admin/members");

  const credit = await prisma.smsCredit.findUnique({ where: { userId } });
  const before = credit?.balance ?? 0;
  const after = before + amount;
  if (after < 0) redirect(memberPath(userId, { tab: "billing", error: "credits_negative" }));

  await prisma.$transaction([
    prisma.smsCredit.upsert({
      where: { userId },
      update: { balance: { increment: amount } },
      create: { userId, balance: Math.max(0, amount) },
    }),
    prisma.transaction.create({
      data: {
        userId,
        type: "ADMIN_ADJUSTMENT",
        amount: 0,
        currency: "CREDITS",
        credits: Math.abs(amount),
        description:
          note ||
          (packageName
            ? `Admin ${amount > 0 ? "credited" : "debited"} ${packageName} package`
            : amount > 0
              ? "Admin credit"
              : "Admin debit"),
        status: "completed",
        metadata: {
          creditsBefore: before,
          creditsAfter: after,
          delta: amount,
          adminId: session.userId,
          packageId: packageId || null,
          packageName: packageName || null,
        },
      },
    }),
  ]);

  let emailOk = false;
  const email = user.email?.trim();
  if (notify && email) {
    const { adminBalanceAdjustmentEmailContent } = await import("@/lib/email/templates");
    const content = await adminBalanceAdjustmentEmailContent({
      memberName: user.fullName,
      kind: "credits",
      delta: amount,
      currency: "CREDITS",
      balanceAfter: after,
      packageName: packageName || undefined,
      note: note || undefined,
    });
    const sent = await sendCriticalMemberEmail({
      to: email,
      toName: user.fullName,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });
    emailOk = sent.ok;
  }

  await logAdmin(amount > 0 ? "ADMIN_CREDIT_SMS" : "ADMIN_DEBIT_SMS", userId, session.userId, {
    amount,
    note,
    packageId: packageId || null,
    emailOk,
    notified: notify && Boolean(email),
  });
  revalidatePath(memberPath(userId));
  redirect(
    memberPath(userId, {
      tab: "billing",
      saved:
        notify && email
          ? emailOk
            ? "credits"
            : "credits_email_failed"
          : "credits",
    }),
  );
}

export async function adminAdjustWalletAction(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("userId"));
  const amount = Number(formData.get("amount"));
  const note = String(formData.get("note") ?? "").trim();
  const packageId = String(formData.get("packageId") ?? "").trim();
  const packageName = String(formData.get("packageName") ?? "").trim();
  const notify = formData.get("notify") !== "0";

  if (!userId || !Number.isFinite(amount) || amount === 0) {
    redirect(memberPath(userId, { tab: "billing", error: "wallet" }));
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, role: "MEMBER" },
    select: { id: true, fullName: true, email: true },
  });
  if (!user) redirect("/admin/members");

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) redirect(memberPath(userId, { tab: "billing", error: "wallet_missing" }));

  const before = wallet.balance.toNumber();
  const after = before + amount;
  if (after < 0) redirect(memberPath(userId, { tab: "billing", error: "wallet_negative" }));

  await prisma.$transaction([
    prisma.wallet.update({
      where: { userId },
      data: { balance: { increment: amount } },
    }),
    prisma.transaction.create({
      data: {
        userId,
        type: "ADMIN_ADJUSTMENT",
        amount: Math.abs(amount),
        currency: wallet.currency,
        description:
          note ||
          (packageName
            ? `Admin wallet ${amount > 0 ? "credit" : "debit"} · ${packageName}`
            : amount > 0
              ? "Admin wallet credit"
              : "Admin wallet debit"),
        status: "completed",
        balanceBefore: before,
        balanceAfter: after,
        metadata: {
          delta: amount,
          adminId: session.userId,
          packageId: packageId || null,
          packageName: packageName || null,
        },
      },
    }),
  ]);

  let emailOk = false;
  const email = user.email?.trim();
  if (notify && email) {
    const { adminBalanceAdjustmentEmailContent } = await import("@/lib/email/templates");
    const content = await adminBalanceAdjustmentEmailContent({
      memberName: user.fullName,
      kind: "wallet",
      delta: amount,
      currency: wallet.currency,
      balanceAfter: after,
      packageName: packageName || undefined,
      note: note || undefined,
    });
    const sent = await sendCriticalMemberEmail({
      to: email,
      toName: user.fullName,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });
    emailOk = sent.ok;
  }

  await logAdmin(amount > 0 ? "ADMIN_CREDIT_WALLET" : "ADMIN_DEBIT_WALLET", userId, session.userId, {
    amount,
    note,
    packageId: packageId || null,
    emailOk,
    notified: notify && Boolean(email),
  });
  revalidatePath(memberPath(userId));
  redirect(
    memberPath(userId, {
      tab: "billing",
      saved:
        notify && email
          ? emailOk
            ? "wallet"
            : "wallet_email_failed"
          : "wallet",
    }),
  );
}

export async function adminUpdateMemberAccessAction(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("userId"));

  const status = String(formData.get("status") ?? "ACTIVE") as MemberAccountStatus;
  const maxSenderIds = Math.max(0, Number(formData.get("maxSenderIds") ?? 5));
  const senderIdsBlocked = formData.get("senderIdsBlocked") === "1";
  const assignedProvider = String(formData.get("assignedProvider") ?? "");
  const adminNote = String(formData.get("adminNote") ?? "").trim();

  await getOrCreateMemberAccount(userId);
  await prisma.memberAccount.update({
    where: { userId },
    data: {
      status,
      maxSenderIds,
      senderIdsBlocked,
      assignedProvider:
        assignedProvider && assignedProvider !== "AUTO"
          ? (assignedProvider as SmsProviderType)
          : null,
      featureApi: formData.get("featureApi") === "1",
      featureCampaigns: formData.get("featureCampaigns") === "1",
      featureWebhooks: formData.get("featureWebhooks") === "1",
      featureBulkSms: formData.get("featureBulkSms") === "1",
      featureWordPress: formData.get("featureWordPress") === "1",
      adminNote: adminNote || null,
      updatedById: session.userId,
      suspendedAt:
        status === "SUSPENDED" || status === "BLOCKED" ? new Date() : null,
      suspendedReason:
        status === "SUSPENDED" || status === "BLOCKED"
          ? String(formData.get("suspendedReason") ?? "Suspended by admin").trim()
          : null,
    },
  });

  await logAdmin("ADMIN_MEMBER_ACCESS", userId, session.userId, { status });
  revalidatePath(memberPath(userId));
  redirect(memberPath(userId, { saved: "access" }));
}

export async function adminSetVerifiedAction(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("userId"));
  const verified = formData.get("verified") === "1";

  await prisma.user.update({
    where: { id: userId },
    data: {
      isVerified: verified,
      ...(verified ? { failedLoginCount: 0, lockedUntil: null } : {}),
    },
  });

  await logAdmin(verified ? "ADMIN_VERIFY_USER" : "ADMIN_UNVERIFY_USER", userId, session.userId);
  revalidatePath(memberPath(userId));
  redirect(memberPath(userId, { tab: "security", saved: "verify" }));
}

export async function adminUnlockLoginAction(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("userId"));

  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginCount: 0, lockedUntil: null },
  });

  await logAdmin("ADMIN_UNLOCK_LOGIN", userId, session.userId);
  redirect(memberPath(userId, { tab: "security", saved: "unlock" }));
}

const SUSPEND_CONFIRM_WORD = "SUSPEND";
const DELETE_CONFIRM_WORD = "DELETE";

async function sendCriticalMemberEmail(params: {
  to: string;
  toName: string;
  subject: string;
  text: string;
  html: string;
}) {
  const { sendEmail, getActiveEmailProvider } = await import("@/lib/email");
  let result = await sendEmail(params);
  const provider = await getActiveEmailProvider();

  if (!result.ok) {
    const { loadMailjetOfficeConfig } = await import("@/lib/email/office-config");
    const mailjet = await loadMailjetOfficeConfig();
    if (mailjet && !mailjet.sandbox) {
      const { sendMailjetEmail } = await import("@/lib/email/mailjet");
      const fallback = await sendMailjetEmail(params);
      if (fallback.ok) {
        return { ...fallback, provider: "mailjet" as const };
      }
      result = {
        ok: false,
        error: `${result.error ?? "Primary email failed"}; Mailjet: ${fallback.error}`,
      };
    }
  }

  return { ...result, provider };
}

export async function adminSuspendMemberAction(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("userId"));
  const confirmText = String(formData.get("confirmText") ?? "").trim().toUpperCase();
  const note = String(formData.get("note") ?? "").trim();
  const reasons = formData
    .getAll("reasons")
    .map((r) => String(r).trim())
    .filter(Boolean);

  if (confirmText !== SUSPEND_CONFIRM_WORD) {
    redirect(memberPath(userId, { tab: "security", error: "suspend_confirm" }));
  }
  if (reasons.length === 0 && !note) {
    redirect(memberPath(userId, { tab: "security", error: "suspend_reason" }));
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, role: "MEMBER" },
    select: { id: true, fullName: true, email: true, phone: true, accountNumber: true },
  });
  if (!user) redirect("/admin/members");

  const reasonSummary = [...reasons, note ? `Note: ${note}` : null].filter(Boolean).join("; ");

  await getOrCreateMemberAccount(userId);
  await prisma.memberAccount.update({
    where: { userId },
    data: {
      status: "SUSPENDED",
      suspendedAt: new Date(),
      suspendedReason: reasonSummary.slice(0, 500) || "Suspended by admin",
      updatedById: session.userId,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginCount: 0, lockedUntil: null },
  });

  let emailOk = false;
  const email = user.email?.trim();
  if (email) {
    const {
      ensureUserAccountNumber,
      formatAccountNumber,
    } = await import("@/lib/auth/account-number");
    const { accountSuspendedEmailContent } = await import("@/lib/email/templates");
    const accountNumber = user.accountNumber ?? (await ensureUserAccountNumber(user.id));
    const content = await accountSuspendedEmailContent({
      memberName: user.fullName,
      memberId: formatAccountNumber(accountNumber),
      reasons,
      note: note || undefined,
    });
    const sent = await sendCriticalMemberEmail({
      to: email,
      toName: user.fullName,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });
    emailOk = sent.ok;
  }

  await logAdmin("ADMIN_SUSPEND_MEMBER", userId, session.userId, {
    reasons,
    note: note || null,
    emailOk,
    hasEmail: Boolean(email),
  });

  revalidatePath(memberPath(userId));
  redirect(
    memberPath(userId, {
      tab: "security",
      saved: email ? (emailOk ? "suspended" : "suspended_email_failed") : "suspended_no_email",
    }),
  );
}

export async function adminReactivateMemberAction(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("userId"));

  const user = await prisma.user.findFirst({
    where: { id: userId, role: "MEMBER" },
    select: { id: true },
  });
  if (!user) redirect("/admin/members");

  await getOrCreateMemberAccount(userId);
  await prisma.memberAccount.update({
    where: { userId },
    data: {
      status: "ACTIVE",
      suspendedAt: null,
      suspendedReason: null,
      updatedById: session.userId,
    },
  });

  await logAdmin("ADMIN_REACTIVATE_MEMBER", userId, session.userId);
  revalidatePath(memberPath(userId));
  redirect(memberPath(userId, { tab: "security", saved: "reactivated" }));
}

export async function adminDeleteMemberAction(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("userId"));
  const confirmText = String(formData.get("confirmText") ?? "").trim().toUpperCase();

  if (confirmText !== DELETE_CONFIRM_WORD) {
    redirect(memberPath(userId, { tab: "security", error: "delete_confirm" }));
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, role: "MEMBER" },
    select: {
      id: true,
      fullName: true,
      phone: true,
      memberAccount: { select: { status: true } },
    },
  });
  if (!user) redirect("/admin/members");

  const status = user.memberAccount?.status ?? "ACTIVE";
  if (status !== "SUSPENDED" && status !== "BLOCKED") {
    redirect(memberPath(userId, { tab: "security", error: "delete_not_suspended" }));
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch {
    redirect(memberPath(userId, { tab: "security", error: "delete_failed" }));
  }

  await logAdmin("ADMIN_DELETE_MEMBER", userId, session.userId, {
    fullName: user.fullName,
    phone: user.phone,
    priorStatus: status,
  });

  revalidatePath("/admin/members");
  redirect("/admin/members?saved=member_deleted");
}

export async function adminResetPasswordAction(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("userId"));
  const password = String(formData.get("password") ?? "").trim();
  const generate = formData.get("generate") === "1";

  const newPassword =
    generate || !password
      ? randomBytes(9).toString("base64url").slice(0, 12)
      : password;

  if (newPassword.length < 8) {
    redirect(memberPath(userId, { error: "password_short" }));
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  await logAdmin("ADMIN_RESET_PASSWORD", userId, session.userId, { generated: generate });
  redirect(memberPath(userId, { tab: "security", saved: "password", temp: newPassword }));
}

export async function adminSendPasswordResetLinkAction(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("userId"));

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/admin/members");

  let saved: "reset_sent" | "reset_failed" = "reset_sent";
  let cooldown = "0";

  try {
    const otp = await createAndSendOtp(
      user.phone,
      "PASSWORD_RESET",
      user.countryCode,
      user.id,
    );
    if (!otp.ok) {
      saved = "reset_failed";
      cooldown = String(otp.cooldownSec ?? 0);
    }
    await logAuthEvent("PASSWORD_RESET_REQUESTED", { phone: user.phone, byAdmin: true }, user.id);
    await logAdmin("ADMIN_SEND_RESET_OTP", userId, session.userId, { ok: otp.ok });
  } catch (e) {
    saved = "reset_failed";
    await logAdmin("ADMIN_SEND_RESET_OTP", userId, session.userId, {
      ok: false,
      error: e instanceof Error ? e.message : "SMS failed",
    });
  }

  redirect(
    memberPath(userId, {
      tab: "security",
      saved,
      ...(saved === "reset_failed" ? { cooldown, error: "sms_failed" } : {}),
    }),
  );
}

/** Email a secure reset link + notify via short SMS. Never Slack-notifies on completion. */
export async function adminSendPasswordResetEmailLinkAction(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("userId"));

  const user = await prisma.user.findFirst({
    where: { id: userId, role: "MEMBER" },
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      accountNumber: true,
    },
  });
  if (!user) redirect("/admin/members");

  const email = user.email?.trim();
  if (!email) {
    redirect(memberPath(userId, { tab: "security", error: "reset_link_no_email" }));
  }

  const { isEmailConfiguredAsync } = await import("@/lib/email/config");
  if (!(await isEmailConfiguredAsync())) {
    redirect(memberPath(userId, { tab: "security", error: "reset_link_email_config" }));
  }

  const {
    ensureUserAccountNumber,
    formatAccountNumber,
  } = await import("@/lib/auth/account-number");
  const {
    buildPasswordResetLinkUrl,
    createPasswordResetLinkToken,
  } = await import("@/lib/auth/password-reset-link");
  const { sendEmail, getActiveEmailProvider } = await import("@/lib/email");
  const { passwordResetLinkEmailContent } = await import("@/lib/email/templates");
  const { sendPlatformAlertSms } = await import("@/lib/sms/platform-notify");
  const { getSiteUrl } = await import("@/lib/site-config");

  const accountNumber = user.accountNumber ?? (await ensureUserAccountNumber(user.id));
  const memberId = formatAccountNumber(accountNumber);
  const loginUrl = `${getSiteUrl()}/login`;
  const token = await createPasswordResetLinkToken(user.id, user.phone);
  const resetUrl = buildPasswordResetLinkUrl(token);

  const content = await passwordResetLinkEmailContent({
    memberName: user.fullName,
    memberId,
    email,
    phone: user.phone,
    resetUrl,
    loginUrl,
  });

  const mailPayload = {
    to: email,
    toName: user.fullName,
    subject: content.subject,
    text: content.text,
    html: content.html,
  };

  let mailResult = await sendEmail(mailPayload);
  let mailProvider = await getActiveEmailProvider();

  // Resend often fails when the brand domain isn't verified; Mailjet is configured
  // for splitsms.com — use it for this critical security email only.
  if (!mailResult.ok) {
    const { loadMailjetOfficeConfig } = await import("@/lib/email/office-config");
    const mailjet = await loadMailjetOfficeConfig();
    if (mailjet && !mailjet.sandbox) {
      const { sendMailjetEmail } = await import("@/lib/email/mailjet");
      const fallback = await sendMailjetEmail(mailPayload);
      if (fallback.ok) {
        mailResult = fallback;
        mailProvider = "mailjet";
      } else {
        mailResult = {
          ok: false,
          error: `${mailResult.error ?? "Primary email failed"}; Mailjet: ${fallback.error}`,
        };
      }
    }
  }

  if (!mailResult.ok) {
    await logAdmin("ADMIN_SEND_RESET_LINK", userId, session.userId, {
      ok: false,
      channel: "email",
      provider: mailProvider,
      error: mailResult.error ?? "email failed",
    });
    redirect(
      memberPath(userId, {
        tab: "security",
        error: "reset_link_email_failed",
        detail: (mailResult.error ?? "email failed").slice(0, 180),
      }),
    );
  }

  const smsBody =
    "A password reset link has been sent to your email. After resetting, sign in at your SplitSMS login page.";
  const smsResult = await sendPlatformAlertSms(user.phone, smsBody);

  await logAuthEvent(
    "PASSWORD_RESET_LINK_SENT",
    {
      phone: user.phone,
      email,
      byAdmin: true,
      smsOk: smsResult.ok,
      provider: mailProvider,
    },
    user.id,
  );
  await logAdmin("ADMIN_SEND_RESET_LINK", userId, session.userId, {
    ok: true,
    email,
    smsOk: smsResult.ok,
    provider: mailProvider,
  });

  redirect(
    memberPath(userId, {
      tab: "security",
      saved: smsResult.ok ? "reset_link_sent" : "reset_link_sent_sms_failed",
    }),
  );
}

export async function adminRevokeApiKeyAction(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("userId"));
  const apiKeyId = String(formData.get("apiKeyId"));
  const active = formData.get("active") === "1";

  await prisma.apiKey.updateMany({
    where: { id: apiKeyId, userId },
    data: { isActive: active },
  });

  await logAdmin(active ? "ADMIN_API_KEY_ENABLED" : "ADMIN_API_KEY_REVOKED", userId, session.userId, {
    apiKeyId,
  });
  redirect(memberPath(userId, { saved: "api_key" }));
}

export async function adminSyncSenderIdStatusAction(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("userId"));
  const senderId = String(formData.get("senderId"));

  const sender = await prisma.senderId.findFirst({
    where: { id: senderId, userId },
  });
  if (!sender) redirect(memberPath(userId, { error: "sender" }));

  await syncSenderIdFromProviders(sender.id);

  await logAdmin("ADMIN_SYNC_SENDER_ID", userId, session.userId, { senderId });
  revalidatePath("/admin/sender-ids");
  redirect(memberPath(userId, { saved: "sender_sync" }));
}

export async function adminApproveSenderFromMemberAction(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const result = await approveSenderIdCore(formData);
  if (!result.ok) {
    redirect(memberPath(userId, { error: result.error }));
  }
  redirect(memberPath(userId, { saved: "sender_approved" }));
}

export async function adminRejectSenderFromMemberAction(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const result = await rejectSenderIdCore(formData);
  if (!result.ok) {
    redirect(memberPath(userId, { error: result.error }));
  }
  redirect(memberPath(userId, { saved: "sender_rejected" }));
}

export async function adminBlockSenderIdAction(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("userId"));
  const senderId = String(formData.get("senderId"));
  const note = String(formData.get("note") ?? "Blocked by admin").trim();

  const sender = await prisma.senderId.findFirst({
    where: { id: senderId, userId },
    select: { value: true },
  });
  if (!sender) redirect(memberPath(userId, { error: "notfound" }));

  await prisma.senderId.updateMany({
    where: { id: senderId, userId },
    data: {
      status: "REJECTED",
      adminNote: note,
      isDefault: false,
    },
  });

  const actor = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { fullName: true },
  });
  const { addBannedSenderId } = await import("@/lib/sender-ids/reserved-names");
  await addBannedSenderId({
    value: sender.value,
    reason: note,
    source: "block",
    actorId: session.userId,
    actorName: actor?.fullName,
    senderRecordId: senderId,
  });

  await logAdmin("ADMIN_BLOCK_SENDER_ID", userId, session.userId, { senderId });
  revalidatePath("/admin/sender-ids");
  redirect(memberPath(userId, { saved: "sender_blocked" }));
}

export async function adminSendMemberOutreachAction(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const returnTab = String(formData.get("returnTab") ?? "messaging");
  const templateId = String(formData.get("templateId") ?? "custom");
  const sendSms = formData.get("sendSms") === "on";
  const sendEmail = formData.get("sendEmail") === "on";
  const smsBody = String(formData.get("smsBody") ?? "").trim();
  const emailSubject = String(formData.get("emailSubject") ?? "").trim();
  const emailText = String(formData.get("emailText") ?? "").trim();

  if (!userId) redirect("/admin/members?error=outreach");
  if (!sendSms && !sendEmail) {
    redirect(memberPath(userId, { tab: returnTab, error: "outreach_channel" }));
  }
  if (sendSms && !smsBody) {
    redirect(memberPath(userId, { tab: returnTab, error: "outreach_sms" }));
  }
  if (sendEmail && (!emailSubject || !emailText)) {
    redirect(memberPath(userId, { tab: returnTab, error: "outreach_email" }));
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, role: "MEMBER" },
    select: { id: true, fullName: true, phone: true, email: true },
  });
  if (!user) redirect(memberPath(userId, { tab: returnTab, error: "notfound" }));

  const { sendEmail: sendMail } = await import("@/lib/email");
  const { adminMemberOutreachEmailContent } = await import("@/lib/email/templates");
  const { sendPlatformAlertSms } = await import("@/lib/sms/platform-notify");
  const { createNotification } = await import("@/lib/notifications");
  const { getMemberOutreachTemplate } = await import("@/lib/admin/member-outreach-templates");
  const { getSiteUrl } = await import("@/lib/site-config");

  const template = getMemberOutreachTemplate(templateId);
  const siteUrl = getSiteUrl();
  const ctaHref = template.href ? `${siteUrl}${template.href}` : undefined;

  const results: { sms?: string; email?: string } = {};

  if (sendSms) {
    if (!user.phone?.trim()) {
      redirect(memberPath(userId, { tab: returnTab, error: "outreach_no_phone" }));
    }
    const smsResult = await sendPlatformAlertSms(user.phone, smsBody);
    if (!smsResult.ok) {
      redirect(
        memberPath(userId, {
          tab: returnTab,
          error: "outreach_sms_failed",
        }),
      );
    }
    results.sms = "sent";
  }

  if (sendEmail) {
    const email = user.email?.trim();
    if (!email) {
      redirect(memberPath(userId, { tab: returnTab, error: "outreach_no_email" }));
    }
    const { subject, text, html } = await adminMemberOutreachEmailContent({
      memberName: user.fullName,
      subject: emailSubject,
      bodyText: emailText,
      ctaHref,
      ctaLabel: template.ctaLabel,
    });
    const mailResult = await sendMail({
      to: email,
      toName: user.fullName,
      subject,
      text,
      html,
    });
    if (!mailResult.ok) {
      redirect(memberPath(userId, { tab: returnTab, error: "outreach_email_failed" }));
    }
    results.email = "sent";
  }

  const channels = [results.sms && "SMS", results.email && "email"].filter(Boolean).join(" and ");
  await createNotification(
    userId,
    "SYSTEM",
    emailSubject || "Message from support",
    smsBody.slice(0, 500),
    template.href ? { href: template.href, ctaLabel: template.ctaLabel } : undefined,
  );

  await logAdmin("ADMIN_MEMBER_OUTREACH", userId, session.userId, {
    templateId,
    sendSms,
    sendEmail,
    channels,
  });

  revalidatePath(memberPath(userId));
  redirect(memberPath(userId, { tab: returnTab, saved: "outreach_sent" }));
}
