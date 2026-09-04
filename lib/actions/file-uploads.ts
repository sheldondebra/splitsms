"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getRealSession as getSession, isAdminRole } from "@/lib/auth/session";
import { sendEmail } from "@/lib/email";
import {
  senderIdDocumentToAdminEmailContent,
  senderIdDocumentToProviderEmailContent,
} from "@/lib/email/templates";
import { PLATFORM_ADMIN_EMAIL } from "@/lib/admin/constants";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    throw new Error("Unauthorized");
  }
  return session;
}

async function loadDocumentForAction(id: string) {
  const doc = await prisma.senderIdVerificationDocument.findUnique({
    where: { id },
    include: {
      sender: { select: { value: true } },
      user: { select: { fullName: true, email: true } },
    },
  });
  if (!doc) throw new Error("Document not found");
  return doc;
}

export async function deleteFileUploadAction(id: string) {
  await requireAdmin();
  await prisma.senderIdVerificationDocument.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/server");
  return { ok: true, message: "File deleted" };
}

export async function emailFileUploadToAdminAction(id: string) {
  await requireAdmin();
  const doc = await loadDocumentForAction(id);

  const { subject, text, html } = await senderIdDocumentToAdminEmailContent({
    senderValue: doc.sender.value,
    filename: doc.filename,
    uploaderName: doc.user.fullName?.trim() || doc.user.email || "Unknown",
  });

  const result = await sendEmail({
    to: PLATFORM_ADMIN_EMAIL,
    subject,
    text,
    html,
    attachments: [{ filename: doc.filename, content: doc.content, contentType: doc.contentType }],
  });

  if (!result.ok) return { ok: false, message: result.error ?? "Failed to send email" };
  return { ok: true, message: `Emailed to ${PLATFORM_ADMIN_EMAIL}` };
}

export async function emailFileUploadToProviderAction(id: string, recipientEmail: string) {
  await requireAdmin();
  const email = recipientEmail.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Enter a valid email address" };
  }

  const doc = await loadDocumentForAction(id);
  const { subject, text, html } = await senderIdDocumentToProviderEmailContent({
    senderValue: doc.sender.value,
  });

  const result = await sendEmail({
    to: email,
    subject,
    text,
    html,
    attachments: [{ filename: doc.filename, content: doc.content, contentType: doc.contentType }],
  });

  if (!result.ok) return { ok: false, message: result.error ?? "Failed to send email" };

  await prisma.auditLog.create({
    data: {
      actorId: (await getSession())!.userId,
      action: "SENDER_ID_DOCUMENT_SENT_TO_PROVIDER",
      entityType: "SenderIdVerificationDocument",
      entityId: id,
      metadata: { recipientEmail: email, senderValue: doc.sender.value, filename: doc.filename },
    },
  });

  return { ok: true, message: `Sent to ${email}` };
}
