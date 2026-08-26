"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { retryRespondentSms } from "@/lib/smart-forms/sms-automation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const automationSchema = z.object({
  sendToRespondent: z.boolean(),
  sendToAdmin: z.boolean(),
  adminPhone: z.string().max(20),
  senderId: z.string().max(11),
  respondentMessageTemplate: z.string().max(500),
  adminMessageTemplate: z.string().max(500),
});

export async function saveSmartFormAutomationAction(
  formId: string,
  payloadJson: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not signed in." };

  let payload: z.infer<typeof automationSchema>;
  try {
    payload = automationSchema.parse(JSON.parse(payloadJson));
  } catch {
    return { ok: false, error: "Invalid automation settings." };
  }

  const form = await prisma.smartForm.findFirst({
    where: { id: formId, userId: session.userId },
    select: { id: true },
  });
  if (!form) return { ok: false, error: "Form not found." };

  if (!payload.sendToRespondent && !payload.sendToAdmin) {
    await prisma.smartFormSmsAutomation.deleteMany({ where: { formId } });
  } else {
    await prisma.smartFormSmsAutomation.upsert({
      where: { formId },
      create: {
        formId,
        sendToRespondent: payload.sendToRespondent,
        sendToAdmin: payload.sendToAdmin,
        adminPhone: payload.adminPhone.trim() || null,
        senderId: payload.senderId.trim() || null,
        respondentMessageTemplate: payload.respondentMessageTemplate.trim() || null,
        adminMessageTemplate: payload.adminMessageTemplate.trim() || null,
      },
      update: {
        sendToRespondent: payload.sendToRespondent,
        sendToAdmin: payload.sendToAdmin,
        adminPhone: payload.adminPhone.trim() || null,
        senderId: payload.senderId.trim() || null,
        respondentMessageTemplate: payload.respondentMessageTemplate.trim() || null,
        adminMessageTemplate: payload.adminMessageTemplate.trim() || null,
      },
    });
  }

  revalidatePath(`/dashboard/forms/${formId}/automation`);
  revalidatePath(`/dashboard/forms/${formId}/builder`);
  return { ok: true };
}

const emailAutomationSchema = z.object({
  sendToRespondent: z.boolean(),
  sendToAdmin: z.boolean(),
  adminEmail: z.string().max(500),
  respondentSubject: z.string().max(160),
  respondentMessageTemplate: z.string().max(4000),
  adminSubject: z.string().max(160),
  adminMessageTemplate: z.string().max(4000),
  reportFrequency: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"]),
  reportEmail: z.string().max(500),
});

export async function saveSmartFormEmailAutomationAction(
  formId: string,
  payloadJson: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not signed in." };

  let payload: z.infer<typeof emailAutomationSchema>;
  try {
    payload = emailAutomationSchema.parse(JSON.parse(payloadJson));
  } catch {
    return { ok: false, error: "Invalid email settings." };
  }

  const form = await prisma.smartForm.findFirst({
    where: { id: formId, userId: session.userId },
    select: { id: true },
  });
  if (!form) return { ok: false, error: "Form not found." };

  const inactive =
    !payload.sendToRespondent &&
    !payload.sendToAdmin &&
    payload.reportFrequency === "NONE";

  if (inactive) {
    await prisma.smartFormEmailAutomation.deleteMany({ where: { formId } });
  } else {
    await prisma.smartFormEmailAutomation.upsert({
      where: { formId },
      create: {
        formId,
        sendToRespondent: payload.sendToRespondent,
        sendToAdmin: payload.sendToAdmin,
        adminEmail: payload.adminEmail.trim() || null,
        respondentSubject: payload.respondentSubject.trim() || null,
        respondentMessageTemplate: payload.respondentMessageTemplate.trim() || null,
        adminSubject: payload.adminSubject.trim() || null,
        adminMessageTemplate: payload.adminMessageTemplate.trim() || null,
        reportFrequency: payload.reportFrequency,
        reportEmail: payload.reportEmail.trim() || null,
      },
      update: {
        sendToRespondent: payload.sendToRespondent,
        sendToAdmin: payload.sendToAdmin,
        adminEmail: payload.adminEmail.trim() || null,
        respondentSubject: payload.respondentSubject.trim() || null,
        respondentMessageTemplate: payload.respondentMessageTemplate.trim() || null,
        adminSubject: payload.adminSubject.trim() || null,
        adminMessageTemplate: payload.adminMessageTemplate.trim() || null,
        reportFrequency: payload.reportFrequency,
        reportEmail: payload.reportEmail.trim() || null,
      },
    });
  }

  revalidatePath(`/dashboard/forms/${formId}/builder`);
  return { ok: true };
}

export async function retryRespondentSmsAction(formId: string, responseId: string) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Not signed in." };

  const result = await retryRespondentSms(session.userId, formId, responseId);
  revalidatePath(`/dashboard/forms/${formId}/responses`);
  revalidatePath(`/dashboard/forms/${formId}/responses/${responseId}`);
  return result;
}

export async function retryRespondentSmsBulkAction(formId: string, responseIds: string[]) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Not signed in." };

  const ids = [...new Set(responseIds)].slice(0, 200);
  if (ids.length === 0) {
    return { ok: false as const, error: "Select at least one response." };
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const responseId of ids) {
    const result = await retryRespondentSms(session.userId, formId, responseId);
    if (result.ok) {
      sent++;
      continue;
    }
    if (result.error === "SMS was not sent.") {
      skipped++;
      continue;
    }
    failed++;
    if (errors.length < 3) errors.push(result.error);
  }

  revalidatePath(`/dashboard/forms/${formId}/responses`);

  return {
    ok: true as const,
    attempted: ids.length,
    sent,
    failed,
    skipped,
    errors,
  };
}
