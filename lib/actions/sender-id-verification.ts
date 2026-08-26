"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifySenderIdVerificationToken } from "@/lib/sender-ids/verification-link";
import { notifyDocumentUploaded } from "@/lib/sender-ids/notifications";
import { memberSenderNote } from "@/lib/sms/member-facing";
import { isMnotifyHoldStatus } from "@/lib/sender-ids/provider-status";
import type { SenderIdDocumentType } from "@/lib/generated/prisma/client";

const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const DOC_TYPES: SenderIdDocumentType[] = [
  "BUSINESS_REGISTRATION",
  "PASSPORT",
  "GHANA_CARD",
  "OTHER_ID",
];

export type SenderIdVerificationContext =
  | { ok: false; error: "invalid_token" | "not_found" }
  | {
      ok: true;
      alreadyApproved: boolean;
      senderId: string;
      value: string;
      countryCode: string;
      reason: string | null;
    };

export async function getSenderIdVerificationContext(
  token: string,
): Promise<SenderIdVerificationContext> {
  const payload = await verifySenderIdVerificationToken(token);
  if (!payload) return { ok: false, error: "invalid_token" };

  const sender = await prisma.senderId.findFirst({
    where: { id: payload.senderId, userId: payload.userId },
  });
  if (!sender) return { ok: false, error: "not_found" };

  const reason =
    sender.status === "REJECTED"
      ? memberSenderNote(sender.adminNote, sender.status)
      : isMnotifyHoldStatus(sender.providerStatus)
        ? "This sender ID is on hold with the carrier."
        : null;

  return {
    ok: true,
    alreadyApproved: sender.status === "APPROVED",
    senderId: sender.id,
    value: sender.value,
    countryCode: sender.countryCode,
    reason,
  };
}

export type SubmitDocumentResult = { ok: true } | { ok: false; error: string };

export async function submitSenderIdVerificationDocumentAction(
  formData: FormData,
): Promise<SubmitDocumentResult> {
  const token = String(formData.get("token") ?? "");
  const payload = await verifySenderIdVerificationToken(token);
  if (!payload) return { ok: false, error: "This link has expired. Ask us to resend it." };

  const sender = await prisma.senderId.findFirst({
    where: { id: payload.senderId, userId: payload.userId },
  });
  if (!sender) return { ok: false, error: "We couldn't find that sender ID." };

  const docTypeRaw = String(formData.get("docType") ?? "");
  const docType = DOC_TYPES.includes(docTypeRaw as SenderIdDocumentType)
    ? (docTypeRaw as SenderIdDocumentType)
    : null;
  if (!docType) return { ok: false, error: "Choose a document type." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size <= 0) {
    return { ok: false, error: "Choose a file to upload." };
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return { ok: false, error: "File must be 5MB or smaller." };
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, error: "Use a PDF, JPG, or PNG file." };
  }

  const content = Buffer.from(await file.arrayBuffer());

  const doc = await prisma.senderIdVerificationDocument.create({
    data: {
      senderId: sender.id,
      userId: sender.userId,
      docType,
      filename: file.name.slice(0, 200),
      contentType: file.type,
      content,
    },
  });

  await notifyDocumentUploaded(doc.id).catch(() => undefined);

  return { ok: true };
}

export async function submitSenderIdVerificationDocumentFormAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const result = await submitSenderIdVerificationDocumentAction(formData);
  if (!result.ok) {
    redirect(`/sender-id/verify?token=${encodeURIComponent(token)}&error=${encodeURIComponent(result.error)}`);
  }
  redirect(`/sender-id/verify/success?token=${encodeURIComponent(token)}`);
}
