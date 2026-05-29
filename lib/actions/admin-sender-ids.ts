"use server";

import { getSession, isAdminRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getOrCreateMemberAccount } from "@/lib/admin/member-account";
import { DEFAULT_COUNTRY_CODE } from "@/lib/constants/defaults";
import {
  normalizeSenderIdValue,
  validateSenderIdValue,
} from "@/lib/sender-ids/normalize";
import {
  registerSenderIdWithAllProviders,
  syncSenderIdFromProviders,
} from "@/lib/sender-ids/provider-sync";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function revalidateSenderPaths(userId?: string) {
  revalidatePath("/admin/sender-ids");
  revalidatePath("/dashboard/sender-ids");
  revalidatePath("/dashboard/send");
  if (userId) revalidatePath(`/admin/members/${userId}`);
}

async function requireAdminSession() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");
  return session;
}

export async function approveSenderIdAction(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id"));
  const isDefault = formData.get("setDefault") === "1";
  const userId = (
    await prisma.senderId.findUnique({ where: { id }, select: { userId: true } })
  )?.userId;

  if (userId && isDefault) {
    await prisma.senderId.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  await prisma.senderId.update({
    where: { id },
    data: {
      status: "APPROVED",
      ...(isDefault ? { isDefault: true } : {}),
    },
  });
  revalidateSenderPaths(userId);
}

export async function rejectSenderIdAction(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id"));
  const userId = (
    await prisma.senderId.findUnique({ where: { id }, select: { userId: true } })
  )?.userId;

  await prisma.senderId.update({
    where: { id },
    data: {
      status: "REJECTED",
      adminNote: String(formData.get("note") ?? "Does not meet naming requirements").trim(),
      isDefault: false,
    },
  });
  revalidateSenderPaths(userId);
}

export async function adminCreateSenderIdAction(formData: FormData) {
  const session = await requireAdminSession();

  const userId = String(formData.get("userId") ?? "").trim();
  const value = normalizeSenderIdValue(String(formData.get("value") ?? ""));
  const countryCode = String(formData.get("countryCode") ?? DEFAULT_COUNTRY_CODE)
    .trim()
    .toUpperCase();
  const purposeRaw = String(formData.get("purpose") ?? "").trim();
  const setDefault = formData.get("setDefault") === "on" || formData.get("setDefault") === "1";
  const submitToProviders = formData.get("submitToProviders") !== "off";
  const returnTo = String(formData.get("returnTo") ?? "/admin/sender-ids?tab=register");

  if (!userId) {
    redirect(`${returnTo}&error=user`);
  }

  const validation = validateSenderIdValue(value);
  if (!validation.ok) {
    redirect(`${returnTo}&error=invalid`);
  }

  const member = await prisma.user.findFirst({
    where: { id: userId, role: "MEMBER" },
    select: { id: true, fullName: true },
  });
  if (!member) redirect(`${returnTo}&error=user`);

  const account = await getOrCreateMemberAccount(userId);
  if (account.senderIdsBlocked) redirect(`${returnTo}&error=blocked`);

  const senderCount = await prisma.senderId.count({ where: { userId } });
  if (senderCount >= account.maxSenderIds) redirect(`${returnTo}&error=limit`);

  const duplicate = await prisma.senderId.findFirst({ where: { userId, value } });
  if (duplicate) redirect(`${returnTo}&error=duplicate`);

  if (setDefault) {
    await prisma.senderId.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  const purpose =
    purposeRaw ||
    `SplitSMS sender ID for ${member.fullName ?? "customer"} (${value})`;

  const sender = await prisma.senderId.create({
    data: {
      userId,
      value,
      countryCode,
      status: "PENDING",
      isDefault: setDefault,
      adminNote: "Registered by admin — pending platform approval.",
    },
  });

  if (submitToProviders) {
    await registerSenderIdWithAllProviders({
      senderRecordId: sender.id,
      userId,
      value,
      purpose,
      countryCode,
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "ADMIN_CREATE_SENDER_ID",
      entityType: "SenderId",
      entityId: sender.id,
      metadata: { userId, value, countryCode, submitToProviders },
    },
  });

  revalidateSenderPaths(userId);
  redirect(`${returnTo}&saved=created`);
}

export async function adminSyncSenderProvidersAction(formData: FormData) {
  await requireAdminSession();
  const senderId = String(formData.get("senderId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "/admin/sender-ids");

  const sender = await prisma.senderId.findUnique({
    where: { id: senderId },
    select: { userId: true },
  });
  if (!sender) redirect(`${returnTo}&error=notfound`);

  await syncSenderIdFromProviders(senderId);
  revalidateSenderPaths(sender.userId);
  redirect(`${returnTo}&saved=sync`);
}
