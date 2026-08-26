"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_COUNTRY_CODE } from "@/lib/constants/defaults";
import { normalizeSenderIdValue, validateSenderIdForRegistration } from "@/lib/sender-ids/normalize";
import { notifyAdminsNewSenderId, notifyUserSenderIdDocumentsRequested } from "@/lib/sender-ids/notifications";
import { getOrCreateMemberAccount } from "@/lib/admin/member-account";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const MIN_REASON_LENGTH = 10;
const MAX_REASON_LENGTH = 500;

async function memberCountryCode(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { countryCode: true },
  });
  const cc = user?.countryCode?.trim().toUpperCase();
  return cc && cc.length === 2 ? cc : DEFAULT_COUNTRY_CODE;
}

/** Live check while the member types a sender ID (no redirect). */
export async function previewSenderIdRegistrationAction(value: string) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Sign in required", code: "invalid" as const };

  const normalized = normalizeSenderIdValue(value);
  if (!normalized) {
    return { ok: true as const };
  }

  const countryCode = await memberCountryCode(session.userId);
  return validateSenderIdForRegistration(normalized, { countryCode });
}

export type RequestSenderIdState = {
  ok?: boolean;
  value?: string;
  id?: string;
  errorCode?: string;
};

export async function requestSenderIdAction(
  _prev: RequestSenderIdState,
  formData: FormData,
): Promise<RequestSenderIdState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const value = normalizeSenderIdValue(String(formData.get("value") ?? ""));
  const reason = String(formData.get("reason") ?? "").trim();
  const countryCode = await memberCountryCode(session.userId);

  if (!reason || reason.length < MIN_REASON_LENGTH || reason.length > MAX_REASON_LENGTH) {
    return { errorCode: "reason" };
  }

  const validation = await validateSenderIdForRegistration(value, { countryCode });
  if (!validation.ok) {
    return { errorCode: validation.code };
  }

  const account = await getOrCreateMemberAccount(session.userId);
  if (account.senderIdsBlocked) {
    return { errorCode: "blocked" };
  }

  const senderCount = await prisma.senderId.count({ where: { userId: session.userId } });
  if (senderCount >= account.maxSenderIds) {
    return { errorCode: "limit" };
  }

  const duplicate = await prisma.senderId.findFirst({
    where: { userId: session.userId, value },
  });
  if (duplicate) {
    return { errorCode: "duplicate" };
  }

  const sender = await prisma.senderId.create({
    data: {
      userId: session.userId,
      value,
      countryCode,
      status: "PENDING",
      adminNote: `Purpose: ${reason}`,
    },
  });

  void notifyAdminsNewSenderId(sender.id).catch(() => undefined);
  void import("@/lib/sender-ids/notifications").then(({ ensureRegisterSenderIdNotification }) =>
    ensureRegisterSenderIdNotification(session.userId),
  );

  revalidatePath("/dashboard/sender-ids");
  revalidatePath("/dashboard/send");

  return { ok: true, value, id: sender.id };
}

export async function setDefaultSenderIdAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const id = String(formData.get("id") ?? "");
  const sender = await prisma.senderId.findFirst({
    where: { id, userId: session.userId, status: "APPROVED" },
  });

  if (!sender) redirect("/dashboard/sender-ids?error=notfound");

  await prisma.$transaction([
    prisma.senderId.updateMany({
      where: { userId: session.userId },
      data: { isDefault: false },
    }),
    prisma.senderId.update({
      where: { id },
      data: { isDefault: true },
    }),
  ]);

  revalidatePath("/dashboard/sender-ids");
  revalidatePath("/dashboard/send");
  redirect("/dashboard/sender-ids?default=1");
}

/** Member asks us to resend the verification-document upload link. */
export async function resendSenderIdVerificationEmailAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const id = String(formData.get("id") ?? "");
  const sender = await prisma.senderId.findFirst({
    where: { id, userId: session.userId },
  });
  if (!sender) redirect("/dashboard/sender-ids?error=notfound");

  await notifyUserSenderIdDocumentsRequested(
    id,
    "We still need a document to continue reviewing this sender ID.",
  ).catch(() => undefined);

  redirect("/dashboard/sender-ids?docsent=1");
}
