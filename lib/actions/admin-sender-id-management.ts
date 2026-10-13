"use server";

import { getRealSession as getSession, isAdminRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resolveSuspensionDuration, setSenderIdRestriction } from "@/lib/sender-ids/management";
import {
  notifyUserSenderIdAssignedCopy,
  notifyUserSenderIdBlocked,
  notifyUserSenderIdReassigned,
  notifyUserSenderIdRestored,
  notifyUserSenderIdSuspended,
} from "@/lib/sender-ids/notifications";
import { maybeSetFirstDefault, registerSenderIdWithSingleProvider } from "@/lib/sender-ids/provider-sync";
import type { SenderIdProviderType } from "@/lib/generated/prisma/client";

export type SenderIdManagementResult =
  | { ok: true; message: string }
  | { ok: false; error: string; message: string };

async function requireAdminSession() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");
  return session;
}

function revalidateManagementPaths(senderRecordId: string, userIds: (string | undefined)[]) {
  revalidatePath("/admin/sender-ids");
  revalidatePath(`/admin/sender-ids/${senderRecordId}`);
  revalidatePath("/dashboard/sender-ids");
  revalidatePath("/dashboard/send");
  for (const userId of userIds) {
    if (userId) revalidatePath(`/admin/members/${userId}`);
  }
}

async function logSenderIdAction(
  actorId: string,
  action: string,
  senderRecordId: string,
  metadata?: Prisma.InputJsonValue,
) {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      entityType: "SenderId",
      entityId: senderRecordId,
      metadata,
    },
  });
}

export async function restrictSenderIdJsonAction(input: {
  id: string;
  mode: "suspend" | "block" | "restore";
  reason?: string;
  durationKey?: string;
}): Promise<SenderIdManagementResult> {
  const session = await requireAdminSession();
  const sender = await prisma.senderId.findUnique({
    where: { id: input.id },
    select: { id: true, value: true, status: true, userId: true },
  });
  if (!sender) return { ok: false, error: "notfound", message: "Sender ID not found." };

  if (sender.status !== "APPROVED" && input.mode !== "restore") {
    return {
      ok: false,
      error: "not_approved",
      message: "Only approved sender IDs can be suspended or blocked here.",
    };
  }

  if (input.mode === "restore") {
    await setSenderIdRestriction(input.id, { status: "ACTIVE" }, session.userId);
    await logSenderIdAction(session.userId, "SENDER_ID_RESTORED", input.id, { value: sender.value });
    await notifyUserSenderIdRestored(input.id).catch(() => undefined);
    revalidateManagementPaths(input.id, [sender.userId]);
    return { ok: true, message: `${sender.value} restored — active again.` };
  }

  const reason = input.reason?.trim();
  if (!reason) {
    return { ok: false, error: "reason_required", message: "A reason is required." };
  }

  if (input.mode === "block") {
    await setSenderIdRestriction(input.id, { status: "BLOCKED", reason }, session.userId);
    await logSenderIdAction(session.userId, "SENDER_ID_BLOCKED", input.id, { value: sender.value, reason });
    await notifyUserSenderIdBlocked(input.id, reason).catch(() => undefined);
    revalidateManagementPaths(input.id, [sender.userId]);
    return { ok: true, message: `${sender.value} blocked and member notified.` };
  }

  const until = resolveSuspensionDuration(input.durationKey ?? "indefinite");
  await setSenderIdRestriction(
    input.id,
    { status: "SUSPENDED", reason, suspendedUntil: until },
    session.userId,
  );
  await logSenderIdAction(session.userId, "SENDER_ID_SUSPENDED", input.id, {
    value: sender.value,
    reason,
    suspendedUntil: until?.toISOString() ?? null,
  });
  await notifyUserSenderIdSuspended(input.id, reason, until).catch(() => undefined);
  revalidateManagementPaths(input.id, [sender.userId]);
  return {
    ok: true,
    message: `${sender.value} suspended${until ? ` until ${until.toLocaleString()}` : " indefinitely"} and member notified.`,
  };
}

export async function reassignSenderIdJsonAction(input: {
  id: string;
  newUserId: string;
  note?: string;
}): Promise<SenderIdManagementResult> {
  const session = await requireAdminSession();

  const sender = await prisma.senderId.findUnique({
    where: { id: input.id },
    include: { user: { select: { id: true, fullName: true, phone: true, email: true } } },
  });
  if (!sender) return { ok: false, error: "notfound", message: "Sender ID not found." };

  if (sender.userId === input.newUserId) {
    return { ok: false, error: "same_owner", message: "This member already owns this sender ID." };
  }

  const target = await prisma.user.findUnique({
    where: { id: input.newUserId },
    select: { id: true, fullName: true },
  });
  if (!target) return { ok: false, error: "no_target", message: "Target member not found." };

  const duplicate = await prisma.senderId.findFirst({
    where: { userId: input.newUserId, value: sender.value },
  });
  if (duplicate) {
    return {
      ok: false,
      error: "duplicate",
      message: `${target.fullName} already has a "${sender.value}" sender ID. Remove it first or use "Assign same sender ID" instead.`,
    };
  }

  const previousOwner = sender.user;

  await prisma.$transaction([
    prisma.senderId.updateMany({
      where: { userId: input.newUserId },
      data: { isDefault: false },
    }),
    prisma.senderId.update({
      where: { id: input.id },
      data: { userId: input.newUserId },
    }),
  ]);

  await logSenderIdAction(session.userId, "SENDER_ID_REASSIGNED", input.id, {
    value: sender.value,
    fromUserId: previousOwner.id,
    toUserId: input.newUserId,
    note: input.note?.trim() || undefined,
  });

  await notifyUserSenderIdReassigned(input.id, previousOwner).catch(() => undefined);

  revalidateManagementPaths(input.id, [previousOwner.id, input.newUserId]);
  return { ok: true, message: `${sender.value} reassigned to ${target.fullName}.` };
}

export async function assignSenderIdCopyJsonAction(input: {
  id: string;
  newUserId: string;
}): Promise<SenderIdManagementResult & { newSenderId?: string }> {
  const session = await requireAdminSession();

  const source = await prisma.senderId.findUnique({
    where: { id: input.id },
    include: { providerRegistrations: true },
  });
  if (!source) return { ok: false, error: "notfound", message: "Sender ID not found." };

  if (source.status !== "APPROVED") {
    return {
      ok: false,
      error: "not_approved",
      message: "Only an approved sender ID can be shared with another member.",
    };
  }

  const target = await prisma.user.findUnique({
    where: { id: input.newUserId },
    select: { id: true, fullName: true },
  });
  if (!target) return { ok: false, error: "no_target", message: "Target member not found." };

  const duplicate = await prisma.senderId.findFirst({
    where: { userId: input.newUserId, value: source.value },
  });
  if (duplicate) {
    return {
      ok: false,
      error: "duplicate",
      message: `${target.fullName} already has a "${source.value}" sender ID.`,
    };
  }

  const created = await prisma.senderId.create({
    data: {
      userId: input.newUserId,
      value: source.value,
      countryCode: source.countryCode,
      status: "APPROVED",
      adminNote: "Granted by admin — shared sender ID (copied from an existing approved registration).",
      providerStatus: source.providerStatus,
      providerSubmittedAt: source.providerSubmittedAt,
    },
  });

  if (source.providerRegistrations.length > 0) {
    await prisma.senderIdProviderRegistration.createMany({
      data: source.providerRegistrations.map((r) => ({
        senderId: created.id,
        provider: r.provider,
        status: r.status,
        externalRef: r.externalRef,
        providerStatus: r.providerStatus,
        error: r.error,
        submittedAt: r.submittedAt,
      })),
    });
  }

  await maybeSetFirstDefault(input.newUserId, created.id).catch(() => undefined);

  await logSenderIdAction(session.userId, "SENDER_ID_ASSIGNED_COPY", input.id, {
    value: source.value,
    newSenderId: created.id,
    toUserId: input.newUserId,
  });

  await notifyUserSenderIdAssignedCopy(created.id).catch(() => undefined);

  revalidateManagementPaths(input.id, [source.userId, input.newUserId]);
  return {
    ok: true,
    message: `${source.value} granted to ${target.fullName}.`,
    newSenderId: created.id,
  };
}

export async function resendSenderIdToProviderJsonAction(input: {
  id: string;
  provider: Extract<SenderIdProviderType, "MNOTIFY" | "TWILIO" | "INFOBIP">;
  purpose?: string;
}): Promise<SenderIdManagementResult> {
  const session = await requireAdminSession();

  const sender = await prisma.senderId.findUnique({
    where: { id: input.id },
    include: { user: { select: { fullName: true } } },
  });
  if (!sender) return { ok: false, error: "notfound", message: "Sender ID not found." };

  const purpose =
    input.purpose?.trim() ||
    sender.adminNote?.trim() ||
    `SplitSMS sender ID for ${sender.user.fullName ?? "customer"} (${sender.value})`;

  const result = await registerSenderIdWithSingleProvider({
    senderRecordId: input.id,
    value: sender.value,
    purpose,
    countryCode: sender.countryCode,
    provider: input.provider,
  });

  await logSenderIdAction(session.userId, "SENDER_ID_RESENT_TO_PROVIDER", input.id, {
    value: sender.value,
    provider: input.provider,
    status: result.status,
  });

  revalidateManagementPaths(input.id, [sender.userId]);

  if (result.status === "REJECTED" || result.status === "FAILED") {
    return {
      ok: false,
      error: "provider_rejected",
      message: `${input.provider}: ${result.error ?? result.providerStatus ?? "registration failed"}.`,
    };
  }

  return {
    ok: true,
    message: `${sender.value} ${result.status === "APPROVED" ? "approved" : "submitted"} on ${input.provider}${
      result.providerStatus ? ` — ${result.providerStatus}` : ""
    }.`,
  };
}

export async function updateSenderIdNoteJsonAction(input: {
  id: string;
  note: string;
}): Promise<SenderIdManagementResult> {
  const session = await requireAdminSession();

  const sender = await prisma.senderId.findUnique({
    where: { id: input.id },
    select: { id: true, value: true, userId: true },
  });
  if (!sender) return { ok: false, error: "notfound", message: "Sender ID not found." };

  const note = input.note.trim();
  await prisma.senderId.update({ where: { id: input.id }, data: { adminNote: note || null } });

  await logSenderIdAction(session.userId, "SENDER_ID_NOTE_UPDATED", input.id, {
    value: sender.value,
  });

  revalidateManagementPaths(input.id, [sender.userId]);
  return { ok: true, message: "Note saved." };
}

export async function setSenderIdDefaultJsonAction(input: {
  id: string;
}): Promise<SenderIdManagementResult> {
  const session = await requireAdminSession();

  const sender = await prisma.senderId.findUnique({
    where: { id: input.id },
    select: { id: true, value: true, userId: true, status: true, isDefault: true },
  });
  if (!sender) return { ok: false, error: "notfound", message: "Sender ID not found." };
  if (sender.status !== "APPROVED") {
    return { ok: false, error: "not_approved", message: "Only an approved sender ID can be set as default." };
  }
  if (sender.isDefault) {
    return { ok: true, message: `${sender.value} is already the default.` };
  }

  await prisma.$transaction([
    prisma.senderId.updateMany({
      where: { userId: sender.userId },
      data: { isDefault: false },
    }),
    prisma.senderId.update({
      where: { id: input.id },
      data: { isDefault: true },
    }),
  ]);

  await logSenderIdAction(session.userId, "SENDER_ID_SET_DEFAULT", input.id, { value: sender.value });

  revalidateManagementPaths(input.id, [sender.userId]);
  return { ok: true, message: `${sender.value} is now the default sender ID.` };
}
