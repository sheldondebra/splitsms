"use server";

import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { createAndSendOtp } from "@/lib/auth/otp";
import { logAuthEvent } from "@/lib/auth/audit";
import {
  approveSenderIdAction,
  rejectSenderIdAction,
} from "@/lib/actions/admin-sender-ids";
import { getOrCreateMemberAccount } from "@/lib/admin/member-account";
import {
  applyProviderStatusToSender,
  submitSenderIdToMnotify,
} from "@/lib/sender-ids/provider-sync";
import { isMnotifyConfigured } from "@/lib/mnotify";
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

  if (!userId || !Number.isFinite(amount) || amount === 0) {
    redirect(memberPath(userId, { error: "credits" }));
  }

  const credit = await prisma.smsCredit.findUnique({ where: { userId } });
  const before = credit?.balance ?? 0;
  const after = before + amount;
  if (after < 0) redirect(memberPath(userId, { error: "credits_negative" }));

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
        description: note || (amount > 0 ? "Admin credit" : "Admin debit"),
        status: "completed",
        metadata: { creditsBefore: before, creditsAfter: after, delta: amount, adminId: session.userId },
      },
    }),
  ]);

  await logAdmin(amount > 0 ? "ADMIN_CREDIT_SMS" : "ADMIN_DEBIT_SMS", userId, session.userId, {
    amount,
    note,
  });
  revalidatePath(memberPath(userId));
  redirect(memberPath(userId, { saved: "credits" }));
}

export async function adminAdjustWalletAction(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("userId"));
  const amount = Number(formData.get("amount"));
  const note = String(formData.get("note") ?? "").trim();

  if (!userId || !Number.isFinite(amount) || amount === 0) {
    redirect(memberPath(userId, { error: "wallet" }));
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) redirect(memberPath(userId, { error: "wallet_missing" }));

  const before = wallet.balance.toNumber();
  const after = before + amount;
  if (after < 0) redirect(memberPath(userId, { error: "wallet_negative" }));

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
        description: note || (amount > 0 ? "Admin wallet credit" : "Admin wallet debit"),
        status: "completed",
        balanceBefore: before,
        balanceAfter: after,
        metadata: { delta: amount, adminId: session.userId },
      },
    }),
  ]);

  await logAdmin(amount > 0 ? "ADMIN_CREDIT_WALLET" : "ADMIN_DEBIT_WALLET", userId, session.userId, {
    amount,
    note,
  });
  revalidatePath(memberPath(userId));
  redirect(memberPath(userId, { saved: "wallet" }));
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
  redirect(memberPath(userId, { saved: "verify" }));
}

export async function adminUnlockLoginAction(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("userId"));

  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginCount: 0, lockedUntil: null },
  });

  await logAdmin("ADMIN_UNLOCK_LOGIN", userId, session.userId);
  redirect(memberPath(userId, { saved: "unlock" }));
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
  redirect(memberPath(userId, { saved: "password", temp: newPassword }));
}

export async function adminSendPasswordResetLinkAction(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("userId"));

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/admin/members");

  const otp = await createAndSendOtp(
    user.phone,
    "PASSWORD_RESET",
    user.countryCode,
    user.id,
  );

  await logAuthEvent("PASSWORD_RESET_REQUESTED", { phone: user.phone, byAdmin: true }, user.id);
  await logAdmin("ADMIN_SEND_RESET_OTP", userId, session.userId, { ok: otp.ok });

  redirect(
    memberPath(userId, {
      saved: otp.ok ? "reset_sent" : "reset_failed",
      ...(otp.ok ? {} : { cooldown: String(otp.cooldownSec ?? 0) }),
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

  if (!(await isMnotifyConfigured())) {
    redirect(memberPath(userId, { error: "mnotify" }));
  }

  const result = await submitSenderIdToMnotify(
    sender.value,
    `SplitSMS sender ID check (${sender.value})`,
  );

  if (result.ok && result.providerStatus) {
    await applyProviderStatusToSender(sender.id, userId, result.providerStatus);
  }

  await logAdmin("ADMIN_SYNC_SENDER_ID", userId, session.userId, {
    senderId,
    providerStatus: result.providerStatus,
  });
  revalidatePath("/admin/sender-ids");
  redirect(memberPath(userId, { saved: "sender_sync" }));
}

export async function adminApproveSenderFromMemberAction(formData: FormData) {
  await approveSenderIdAction(formData);
  const userId = String(formData.get("userId") ?? "");
  if (userId) redirect(memberPath(userId, { saved: "sender_approved" }));
}

export async function adminRejectSenderFromMemberAction(formData: FormData) {
  await rejectSenderIdAction(formData);
  const userId = String(formData.get("userId") ?? "");
  if (userId) redirect(memberPath(userId, { saved: "sender_rejected" }));
}

export async function adminBlockSenderIdAction(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("userId"));
  const senderId = String(formData.get("senderId"));

  await prisma.senderId.updateMany({
    where: { id: senderId, userId },
    data: {
      status: "REJECTED",
      adminNote: String(formData.get("note") ?? "Blocked by admin").trim(),
      isDefault: false,
    },
  });

  await logAdmin("ADMIN_BLOCK_SENDER_ID", userId, session.userId, { senderId });
  redirect(memberPath(userId, { saved: "sender_blocked" }));
}
