"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { googleConnectHref } from "@/lib/google/connect-url";
import { loadFormQuestionsForUser } from "@/lib/google/forms-sms";
import { GOOGLE_FORMS_SCOPES } from "@/lib/google/scopes";
import { resolveApprovedSenderForUser } from "@/lib/sender-ids/validate-send";

async function requireUserId() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.userId;
}

export async function saveGoogleFormSmsAutomationAction(formData: FormData) {
  const userId = await requireUserId();
  const formId = String(formData.get("formId") ?? "").trim();
  const phoneFieldId = String(formData.get("phoneFieldId") ?? "").trim();
  const senderIdRaw = String(formData.get("senderId") ?? "").trim();
  const messageTemplate = String(formData.get("messageTemplate") ?? "").trim();
  const formTitle = String(formData.get("formTitle") ?? "").trim() || null;

  if (!formId || !phoneFieldId || !messageTemplate) {
    redirect("/dashboard/integrations/google/forms?error=invalid");
  }

  let senderId: string;
  try {
    senderId = await resolveApprovedSenderForUser(userId, senderIdRaw);
  } catch {
    redirect("/dashboard/integrations/google/forms?error=sender");
  }

  const questions = await loadFormQuestionsForUser(userId, formId);
  if (!questions.ok) {
    redirect(
      googleConnectHref({
        scopes: questions.missingScopes?.length
          ? questions.missingScopes
          : [...GOOGLE_FORMS_SCOPES],
        returnTo: "/dashboard/integrations/google/forms",
        force: questions.code === "reconnect",
      }),
    );
  }

  const questionTitles = Object.fromEntries(
    questions.questions.map((q) => [q.questionId, q.title]),
  );

  await prisma.googleFormSmsAutomation.upsert({
    where: { userId_formId: { userId, formId } },
    create: {
      userId,
      formId,
      formTitle: formTitle ?? questions.title,
      phoneFieldId,
      questionTitles,
      senderId,
      messageTemplate,
      isActive: true,
      // Start from now so we don't SMS historical responses on first connect
      cursor: new Date().toISOString(),
      lastError: null,
    },
    update: {
      formTitle: formTitle ?? questions.title,
      phoneFieldId,
      questionTitles,
      senderId,
      messageTemplate,
      isActive: true,
      lastError: null,
    },
  });

  revalidatePath("/dashboard/integrations/google/forms");
  redirect("/dashboard/integrations/google/forms?saved=1");
}

export async function toggleGoogleFormSmsAutomationAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "").trim();
  const next = String(formData.get("isActive") ?? "") === "1";
  await prisma.googleFormSmsAutomation.updateMany({
    where: { id, userId },
    data: { isActive: next, lastError: next ? null : undefined },
  });
  revalidatePath("/dashboard/integrations/google/forms");
  redirect("/dashboard/integrations/google/forms");
}

export async function deleteGoogleFormSmsAutomationAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "").trim();
  await prisma.googleFormSmsAutomation.deleteMany({ where: { id, userId } });
  revalidatePath("/dashboard/integrations/google/forms");
  redirect("/dashboard/integrations/google/forms");
}
