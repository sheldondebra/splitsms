import { prisma } from "@/lib/db";
import type { SenderIdDocumentType } from "@/lib/generated/prisma/client";
import { sendEmail } from "@/lib/email";
import {
  senderIdAdminAlertContent,
  senderIdApprovedMemberContent,
  senderIdAssignedMemberContent,
  senderIdBlockedMemberContent,
  senderIdDocumentRequestMemberContent,
  senderIdDocumentUploadedAdminAlertContent,
  senderIdDocumentUploadedMemberContent,
  senderIdLiveMemberContent,
  senderIdRejectedMemberContent,
  senderIdRestoredMemberContent,
  senderIdSubmittedMemberContent,
  senderIdSuspendedMemberContent,
  senderIdUnassignedMemberContent,
} from "@/lib/email/templates";
import { resolveAdminAlertRecipients } from "@/lib/admin/alert-recipients";
import { createNotification } from "@/lib/notifications";
import { sendPlatformAlertSms } from "@/lib/sms/platform-notify";
import { getSiteUrl, siteName } from "@/lib/site-config";
import {
  buildSenderIdVerificationUrl,
  createSenderIdVerificationToken,
} from "@/lib/sender-ids/verification-link";

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
  const { subject, text, html } = await senderIdAdminAlertContent({
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
  const sendUrl = `${getSiteUrl()}/dashboard/send`;
  const smsText = `${siteName}: Your sender ID "${sender.value}" is approved and live. Send SMS now: ${sendUrl}`;

  const tasks: Promise<unknown>[] = [];
  if (sender.user.email) {
    const { subject, text, html } = await senderIdApprovedMemberContent({
      value: sender.value,
      memberName: sender.user.fullName,
    });
    tasks.push(sendEmail({ to: sender.user.email, toName: sender.user.fullName, subject, text, html }));
  }
  if (sender.user.phone) {
    tasks.push(sendPlatformAlertSms(sender.user.phone, smsText));
  }
  await Promise.allSettled(tasks);

  await createNotification(sender.user.id, "SYSTEM", title, message, {
    kind: "sender_id_approved",
    senderId: senderRecordId,
    value: sender.value,
    href: "/dashboard/send",
    ctaLabel: "Send SMS",
  });
}

/** Force-notify member that their sender ID is live (SMS + email). Always sends. */
export async function notifyUserSenderIdLive(senderRecordId: string) {
  const sender = await prisma.senderId.findUnique({
    where: { id: senderRecordId },
    include: {
      user: { select: { id: true, fullName: true, phone: true, email: true } },
    },
  });
  if (!sender) return { ok: false as const, error: "notfound" };
  if (sender.status !== "APPROVED") {
    return { ok: false as const, error: "not_approved" };
  }

  const title = `Sender ID is live: ${sender.value}`;
  const message = `Your sender ID "${sender.value}" is live now — you can send SMS with it.`;
  const smsText = `${siteName}: Your sender ID "${sender.value}" is live now. Start sending SMS at ${getSiteUrl()}/dashboard/send`;

  await createNotification(sender.user.id, "SYSTEM", title, message, {
    kind: "sender_id_live",
    senderId: senderRecordId,
    value: sender.value,
    href: "/dashboard/send",
    ctaLabel: "Send SMS",
  });

  const tasks: Promise<unknown>[] = [];
  if (sender.user.email) {
    const { subject, text, html } = await senderIdLiveMemberContent({
      value: sender.value,
      memberName: sender.user.fullName,
    });
    tasks.push(sendEmail({ to: sender.user.email, subject, text, html }));
  }
  if (sender.user.phone) {
    tasks.push(sendPlatformAlertSms(sender.user.phone, smsText));
  }
  await Promise.allSettled(tasks);

  return {
    ok: true as const,
    emailed: Boolean(sender.user.email),
    sms: Boolean(sender.user.phone),
    value: sender.value,
  };
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
    const { subject, text, html } = await senderIdSubmittedMemberContent({
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
    const { subject, text, html } = await senderIdRejectedMemberContent({
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

const DOCUMENT_REQUEST_KIND = "sender_id_documents_requested";
const DOCUMENT_REQUEST_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

/** True if we already emailed this member a document-upload request recently. */
export async function senderIdDocumentRequestOnCooldown(senderRecordId: string) {
  const last = await prisma.notification.findFirst({
    where: {
      type: "SYSTEM",
      AND: [
        { metadata: { path: ["kind"], equals: DOCUMENT_REQUEST_KIND } },
        { metadata: { path: ["senderId"], equals: senderRecordId } },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (!last) return false;
  return Date.now() - last.createdAt.getTime() < DOCUMENT_REQUEST_COOLDOWN_MS;
}

/**
 * Email a member a secure link to upload a verification document, because their
 * sender ID is on hold at the carrier or was not approved. Callers should check
 * `senderIdDocumentRequestOnCooldown` first to avoid re-sending on every sync.
 */
export async function notifyUserSenderIdDocumentsRequested(
  senderRecordId: string,
  reason: string,
): Promise<{ ok: true; uploadUrl: string; value: string } | { ok: false }> {
  const sender = await prisma.senderId.findUnique({
    where: { id: senderRecordId },
    include: {
      user: { select: { id: true, fullName: true, phone: true, email: true } },
    },
  });
  if (!sender) return { ok: false };

  const token = await createSenderIdVerificationToken(sender.user.id, senderRecordId);
  const uploadUrl = buildSenderIdVerificationUrl(token);
  const note = reason.trim() || "We need one more document to continue reviewing this sender ID.";

  const title = `Verify sender ID: ${sender.value}`;
  const message = "Upload a business registration document, or a Passport / Ghana Card, to continue.";

  await createNotification(sender.user.id, "SYSTEM", title, message, {
    kind: DOCUMENT_REQUEST_KIND,
    senderId: senderRecordId,
    value: sender.value,
    href: uploadUrl,
    ctaLabel: "Upload document",
  });

  const tasks: Promise<unknown>[] = [];
  if (sender.user.email) {
    const { subject, text, html } = await senderIdDocumentRequestMemberContent({
      value: sender.value,
      memberName: sender.user.fullName,
      reason: note,
      uploadUrl,
    });
    tasks.push(sendEmail({ to: sender.user.email, toName: sender.user.fullName, subject, text, html }));
  }
  if (sender.user.phone) {
    const smsText = `${siteName}: Verify sender ID "${sender.value}" — upload a document: ${uploadUrl}`;
    tasks.push(sendPlatformAlertSms(sender.user.phone, smsText));
  }
  await Promise.allSettled(tasks);

  return { ok: true, uploadUrl, value: sender.value };
}

/** After a member uploads a verification document: confirm to them, alert admins, ping Slack. */
export async function notifyDocumentUploaded(documentId: string) {
  const doc = await prisma.senderIdVerificationDocument.findUnique({
    where: { id: documentId },
    include: {
      sender: { select: { id: true, value: true, countryCode: true } },
      user: { select: { id: true, fullName: true, phone: true, email: true } },
    },
  });
  if (!doc) return;

  const adminUrl = `${getSiteUrl()}/admin/sender-ids?tab=pending`;

  if (doc.user.email) {
    const { subject, text, html } = await senderIdDocumentUploadedMemberContent({
      value: doc.sender.value,
      memberName: doc.user.fullName,
      docType: doc.docType as SenderIdDocumentType,
    });
    await sendEmail({ to: doc.user.email, toName: doc.user.fullName, subject, text, html }).catch(
      () => undefined,
    );
  }

  const { subject, text, html } = await senderIdDocumentUploadedAdminAlertContent({
    value: doc.sender.value,
    memberName: doc.user.fullName,
    memberPhone: doc.user.phone,
    memberEmail: doc.user.email,
    docType: doc.docType as SenderIdDocumentType,
    adminUrl,
  });
  const recipients = await resolveAdminAlertRecipients();
  await Promise.allSettled(
    recipients
      .filter((r) => r.email)
      .map((r) => sendEmail({ to: r.email!, toName: r.name, subject, text, html })),
  );

  void import("@/lib/slack/sender-id-events")
    .then(({ notifySlackSenderIdDocumentUploaded }) =>
      notifySlackSenderIdDocumentUploaded({
        senderRecordId: doc.sender.id,
        value: doc.sender.value,
        countryCode: doc.sender.countryCode,
        memberName: doc.user.fullName,
        memberPhone: doc.user.phone,
        docType: doc.docType as SenderIdDocumentType,
        adminUrl,
      }),
    )
    .catch(() => undefined);
}

async function loadSenderWithUser(senderRecordId: string) {
  return prisma.senderId.findUnique({
    where: { id: senderRecordId },
    include: {
      user: { select: { id: true, fullName: true, phone: true, email: true } },
    },
  });
}

export async function notifyUserSenderIdSuspended(
  senderRecordId: string,
  reason: string,
  until: Date | null,
) {
  const sender = await loadSenderWithUser(senderRecordId);
  if (!sender) return;

  const untilText = until
    ? until.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
    : null;
  const title = `Sender ID suspended: ${sender.value}`;
  const message = untilText
    ? `Suspended until ${untilText}. Reason: ${reason}`
    : `Suspended indefinitely. Reason: ${reason}`;
  const smsText = `${siteName}: Sender ID "${sender.value}" has been suspended. ${reason}`;

  await createNotification(sender.user.id, "SYSTEM", title, message, {
    kind: "sender_id_suspended",
    senderId: senderRecordId,
    value: sender.value,
    href: "/dashboard/sender-ids",
  });

  const tasks: Promise<unknown>[] = [];
  if (sender.user.email) {
    const { subject, text, html } = await senderIdSuspendedMemberContent({
      value: sender.value,
      memberName: sender.user.fullName,
      reason,
      until: untilText,
    });
    tasks.push(sendEmail({ to: sender.user.email, toName: sender.user.fullName, subject, text, html }));
  }
  if (sender.user.phone) {
    tasks.push(sendPlatformAlertSms(sender.user.phone, smsText));
  }
  await Promise.allSettled(tasks);
}

export async function notifyUserSenderIdBlocked(senderRecordId: string, reason: string) {
  const sender = await loadSenderWithUser(senderRecordId);
  if (!sender) return;

  const title = `Sender ID blocked: ${sender.value}`;
  const message = `Blocked by admin. Reason: ${reason}`;
  const smsText = `${siteName}: Sender ID "${sender.value}" has been blocked. ${reason}`;

  await createNotification(sender.user.id, "SYSTEM", title, message, {
    kind: "sender_id_blocked",
    senderId: senderRecordId,
    value: sender.value,
    href: "/dashboard/sender-ids",
  });

  const tasks: Promise<unknown>[] = [];
  if (sender.user.email) {
    const { subject, text, html } = await senderIdBlockedMemberContent({
      value: sender.value,
      memberName: sender.user.fullName,
      reason,
    });
    tasks.push(sendEmail({ to: sender.user.email, toName: sender.user.fullName, subject, text, html }));
  }
  if (sender.user.phone) {
    tasks.push(sendPlatformAlertSms(sender.user.phone, smsText));
  }
  await Promise.allSettled(tasks);
}

export async function notifyUserSenderIdRestored(senderRecordId: string) {
  const sender = await loadSenderWithUser(senderRecordId);
  if (!sender) return;

  const title = `Sender ID restored: ${sender.value}`;
  const message = `Your sender ID "${sender.value}" is active again.`;
  const smsText = `${siteName}: Sender ID "${sender.value}" has been restored and is active again.`;

  await createNotification(sender.user.id, "SYSTEM", title, message, {
    kind: "sender_id_restored",
    senderId: senderRecordId,
    value: sender.value,
    href: "/dashboard/send",
    ctaLabel: "Send SMS",
  });

  const tasks: Promise<unknown>[] = [];
  if (sender.user.email) {
    const { subject, text, html } = await senderIdRestoredMemberContent({
      value: sender.value,
      memberName: sender.user.fullName,
    });
    tasks.push(sendEmail({ to: sender.user.email, toName: sender.user.fullName, subject, text, html }));
  }
  if (sender.user.phone) {
    tasks.push(sendPlatformAlertSms(sender.user.phone, smsText));
  }
  await Promise.allSettled(tasks);
}

/** Reassignment moves the same record to a new owner — notify both sides. */
export async function notifyUserSenderIdReassigned(
  senderRecordId: string,
  previousOwner: { id: string; fullName: string; phone: string; email: string | null },
) {
  const sender = await loadSenderWithUser(senderRecordId);
  if (!sender) return;

  const newOwnerTasks: Promise<unknown>[] = [];
  const newOwnerTitle = `Sender ID assigned to you: ${sender.value}`;
  await createNotification(
    sender.user.id,
    "SYSTEM",
    newOwnerTitle,
    `The sender ID "${sender.value}" has been assigned to your account.`,
    {
      kind: "sender_id_assigned",
      senderId: senderRecordId,
      value: sender.value,
      href: "/dashboard/send",
      ctaLabel: "Send SMS",
    },
  );
  if (sender.user.email) {
    const { subject, text, html } = await senderIdAssignedMemberContent({
      value: sender.value,
      memberName: sender.user.fullName,
    });
    newOwnerTasks.push(
      sendEmail({ to: sender.user.email, toName: sender.user.fullName, subject, text, html }),
    );
  }
  if (sender.user.phone) {
    newOwnerTasks.push(
      sendPlatformAlertSms(
        sender.user.phone,
        `${siteName}: Sender ID "${sender.value}" has been assigned to your account.`,
      ),
    );
  }

  const prevOwnerTasks: Promise<unknown>[] = [];
  await createNotification(
    previousOwner.id,
    "SYSTEM",
    `Sender ID reassigned: ${sender.value}`,
    `Your sender ID "${sender.value}" has been reassigned to another account.`,
    { kind: "sender_id_unassigned", senderId: senderRecordId, value: sender.value },
  );
  if (previousOwner.email) {
    const { subject, text, html } = await senderIdUnassignedMemberContent({
      value: sender.value,
      memberName: previousOwner.fullName,
    });
    prevOwnerTasks.push(
      sendEmail({ to: previousOwner.email, toName: previousOwner.fullName, subject, text, html }),
    );
  }

  await Promise.allSettled([...newOwnerTasks, ...prevOwnerTasks]);
}

/** A newly cloned sender ID granted to another member (shared text, separate record). */
export async function notifyUserSenderIdAssignedCopy(senderRecordId: string) {
  const sender = await loadSenderWithUser(senderRecordId);
  if (!sender) return;

  await createNotification(
    sender.user.id,
    "SYSTEM",
    `Sender ID assigned to you: ${sender.value}`,
    `An admin has assigned the approved sender ID "${sender.value}" to your account.`,
    {
      kind: "sender_id_assigned",
      senderId: senderRecordId,
      value: sender.value,
      href: "/dashboard/send",
      ctaLabel: "Send SMS",
    },
  );

  const tasks: Promise<unknown>[] = [];
  if (sender.user.email) {
    const { subject, text, html } = await senderIdAssignedMemberContent({
      value: sender.value,
      memberName: sender.user.fullName,
    });
    tasks.push(sendEmail({ to: sender.user.email, toName: sender.user.fullName, subject, text, html }));
  }
  if (sender.user.phone) {
    tasks.push(
      sendPlatformAlertSms(
        sender.user.phone,
        `${siteName}: Sender ID "${sender.value}" has been assigned to your account.`,
      ),
    );
  }
  await Promise.allSettled(tasks);
}
