import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  senderIdAdminAlertContent,
  senderIdApprovedMemberContent,
  senderIdRejectedMemberContent,
  senderIdSubmittedMemberContent,
} from "@/lib/email/templates";
import { resolveAdminAlertRecipients } from "@/lib/admin/alert-recipients";
import { createNotification } from "@/lib/notifications";
import { sendPlatformAlertSms } from "@/lib/sms/platform-notify";
import { getSiteUrl, siteName } from "@/lib/site-config";

export async function notifyAdminsNewSenderId(senderRecordId: string) {
  const sender = await prisma.senderId.findUnique({
    where: { id: senderRecordId },
    include: {
      user: { select: { fullName: true, phone: true, email: true } },
    },
  });
  if (!sender) return;

  const adminUrl = `${getSiteUrl()}/admin/sender-ids?tab=pending`;
  const smsText = `${siteName}: New sender ID "${sender.value}" from ${sender.user.fullName}. Review: ${adminUrl}`;
  const { subject, text, html } = senderIdAdminAlertContent({
    value: sender.value,
    countryCode: sender.countryCode,
    memberName: sender.user.fullName,
    memberPhone: sender.user.phone,
    memberEmail: sender.user.email,
  });

  const recipients = await resolveAdminAlertRecipients();
  await Promise.allSettled(
    recipients.map(async (r) => {
      if (r.email) {
        await sendEmail({ to: r.email, toName: r.name, subject, text, html });
      }
      if (r.phone) {
        await sendPlatformAlertSms(r.phone, smsText);
      }
    }),
  );

  void import("@/lib/slack/notify")
    .then(({ notifySlackNewSenderId }) => notifySlackNewSenderId(senderRecordId))
    .catch(() => undefined);
}

async function userAlreadyNotifiedApproved(userId: string, senderRecordId: string) {
  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      type: "SYSTEM",
      metadata: {
        equals: { kind: "sender_id_approved", senderId: senderRecordId },
      },
    },
  });
  return Boolean(existing);
}

const REGISTER_SENDER_ID_TITLE = "Attention: register sender ID";

export async function ensureRegisterSenderIdNotification(userId: string) {
  const [senderCount, account] = await Promise.all([
    prisma.senderId.count({ where: { userId } }),
    prisma.memberAccount.findUnique({
      where: { userId },
      select: { onboardingCompletedAt: true },
    }),
  ]);

  if (senderCount > 0) {
    await prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
        type: "SYSTEM",
        title: REGISTER_SENDER_ID_TITLE,
      },
      data: { readAt: new Date() },
    });
    return;
  }

  if (!account?.onboardingCompletedAt) return;

  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      readAt: null,
      type: "SYSTEM",
      title: REGISTER_SENDER_ID_TITLE,
    },
  });
  if (existing) return existing;

  return createNotification(
    userId,
    "SYSTEM",
    REGISTER_SENDER_ID_TITLE,
    "Add a sender ID so recipients see your brand name when you send SMS.",
    {
      kind: "register_sender_id",
      href: "/dashboard/sender-ids",
      ctaLabel: "Register sender ID",
    },
  );
}

export async function notifyUserSenderIdApproved(senderRecordId: string) {
  const sender = await prisma.senderId.findUnique({
    where: { id: senderRecordId },
    include: {
      user: { select: { id: true, fullName: true, phone: true, email: true } },
    },
  });
  if (!sender || sender.status !== "APPROVED") return;

  if (await userAlreadyNotifiedApproved(sender.user.id, senderRecordId)) return;

  const title = `Sender ID approved: ${sender.value}`;
  const message = `Your sender ID "${sender.value}" is ready to use when sending SMS.`;
  const smsText = `${siteName}: Your sender ID "${sender.value}" is approved and ready to use.`;

  await createNotification(sender.user.id, "SYSTEM", title, message, {
    kind: "sender_id_approved",
    senderId: senderRecordId,
    value: sender.value,
  });

  const tasks: Promise<unknown>[] = [];
  if (sender.user.email) {
    const { subject, text, html } = senderIdApprovedMemberContent({
      value: sender.value,
      memberName: sender.user.fullName,
    });
    tasks.push(sendEmail({ to: sender.user.email, subject, text, html }));
  }
  if (sender.user.phone) {
    tasks.push(sendPlatformAlertSms(sender.user.phone, smsText));
  }
  await Promise.allSettled(tasks);
}

export async function notifyUserSenderIdSubmitted(senderRecordId: string, purpose: string) {
  const sender = await prisma.senderId.findUnique({
    where: { id: senderRecordId },
    include: {
      user: { select: { id: true, fullName: true, phone: true, email: true } },
    },
  });
  if (!sender) return;

  const title = `Sender ID submitted: ${sender.value}`;
  const message = `Your sender ID "${sender.value}" was submitted to carriers for registration. We'll notify you when you can send SMS with it.`;
  const smsText = `${siteName}: Sender ID "${sender.value}" submitted to carriers for registration. We'll notify you when it's ready.`;

  await createNotification(sender.user.id, "SYSTEM", title, message, {
    kind: "sender_id_submitted",
    senderId: senderRecordId,
    value: sender.value,
    href: "/dashboard/sender-ids",
  });

  const tasks: Promise<unknown>[] = [];
  if (sender.user.email) {
    const { subject, text, html } = senderIdSubmittedMemberContent({
      value: sender.value,
      memberName: sender.user.fullName,
      purpose,
    });
    tasks.push(sendEmail({ to: sender.user.email, subject, text, html }));
  }
  if (sender.user.phone) {
    tasks.push(sendPlatformAlertSms(sender.user.phone, smsText));
  }
  await Promise.allSettled(tasks);
}

export async function notifyUserSenderIdRejected(senderRecordId: string, reason: string) {
  const sender = await prisma.senderId.findUnique({
    where: { id: senderRecordId },
    include: {
      user: { select: { id: true, fullName: true, phone: true, email: true } },
    },
  });
  if (!sender) return;

  const note = reason.trim() || "Does not meet naming requirements";
  const title = `Sender ID not approved: ${sender.value}`;
  const message = note;
  const smsText = `${siteName}: Sender ID "${sender.value}" was not approved. ${note} Register another at ${getSiteUrl()}/dashboard/sender-ids`;

  await createNotification(sender.user.id, "SYSTEM", title, message, {
    kind: "sender_id_rejected",
    senderId: senderRecordId,
    value: sender.value,
    href: "/dashboard/sender-ids",
    ctaLabel: "Register sender ID",
  });

  const tasks: Promise<unknown>[] = [];
  if (sender.user.email) {
    const { subject, text, html } = senderIdRejectedMemberContent({
      value: sender.value,
      memberName: sender.user.fullName,
      reason: note,
    });
    tasks.push(sendEmail({ to: sender.user.email, subject, text, html }));
  }
  if (sender.user.phone) {
    tasks.push(sendPlatformAlertSms(sender.user.phone, smsText));
  }
  await Promise.allSettled(tasks);

  await ensureRegisterSenderIdNotification(sender.user.id).catch(() => undefined);
}
