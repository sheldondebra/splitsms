import { prisma } from "@/lib/db";
import { detectCountryCode } from "@/lib/contacts/country-from-phone";
import { applySmartFormMergeTags } from "@/lib/smart-forms/merge-tags";
import type { BuilderField } from "@/lib/smart-forms/types";
import { deductSmsCredits } from "@/lib/sms/billing";
import { resolveMessagePriority } from "@/lib/enterprise/priority";
import { enqueueSmsJob } from "@/lib/queue/enqueue-sms";
import { resolveApprovedSenderForUser } from "@/lib/sender-ids/validate-send";
import { countSmsUnits } from "@/lib/sms/units";
import { validateRecipientPhone } from "@/lib/sms/phone-validation";
import type { SmartFormSmsStatus } from "@/lib/generated/prisma/client";

type AutomationConfig = {
  sendToRespondent: boolean;
  sendToAdmin: boolean;
  adminPhone: string | null;
  senderId: string | null;
  respondentMessageTemplate: string | null;
  adminMessageTemplate: string | null;
};

type SendResult = { ok: true; messageId: string } | { ok: false; error: string };

async function sendFormSms(
  userId: string,
  recipientRaw: string,
  body: string,
  senderIdRaw: string | null,
  countryCode: string,
  description: string,
): Promise<SendResult> {
  const phoneCheck = validateRecipientPhone(recipientRaw);
  if (!phoneCheck.valid) {
    return { ok: false, error: "Invalid recipient phone number." };
  }

  const recipient = phoneCheck.normalized.replace(/^\+/, "");
  const units = countSmsUnits(body);
  if (!body.trim() || units < 1) {
    return { ok: false, error: "Message is empty." };
  }

  let senderId: string;
  try {
    senderId = await resolveApprovedSenderForUser(userId, senderIdRaw);
  } catch {
    return { ok: false, error: "No approved Sender ID configured." };
  }

  const pricing = await prisma.smsPricing.findFirst({
    where: { country: { code: countryCode }, isActive: true },
  });
  const costPerUnit = pricing?.memberPrice.toNumber() ?? 0.05;
  const totalCost = costPerUnit * units;

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  const currency = wallet?.currency ?? "GHS";

  try {
    await deductSmsCredits(userId, units, totalCost, currency, description, countryCode);
  } catch {
    return { ok: false, error: "Insufficient SMS credits." };
  }

  const priority = resolveMessagePriority({ channel: "smart_form", body });
  const message = await prisma.message.create({
    data: {
      userId,
      recipient,
      body,
      countryCode,
      senderId,
      smsUnits: units,
      cost: totalCost,
      status: "PENDING",
      priority,
      channel: "smart_form",
    },
  });

  await enqueueSmsJob(message.id, countryCode, priority);
  return { ok: true, messageId: message.id };
}

async function logSmsAnalytics(
  formId: string,
  userId: string,
  eventType: "SMS_SENT" | "SMS_FAILED",
  source: string,
  metadata?: Record<string, string>,
) {
  await prisma.smartFormAnalyticsEvent.create({
    data: {
      formId,
      userId,
      eventType,
      source,
      metadata: metadata ?? undefined,
    },
  });
}

export async function runSmartFormSmsAutomation(params: {
  formId: string;
  userId: string;
  formName: string;
  responseId: string;
  automation: AutomationConfig | null;
  fields: BuilderField[];
  answers: { fieldKey: string; value: string }[];
  submittedAt: Date;
}): Promise<{ respondentStatus: SmartFormSmsStatus; smsError: string | null }> {
  const automation = params.automation;
  if (!automation || (!automation.sendToRespondent && !automation.sendToAdmin)) {
    return { respondentStatus: "NONE", smsError: null };
  }

  const owner = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { phone: true, countryCode: true },
  });
  if (!owner) {
    return { respondentStatus: "FAILED", smsError: "Account not found." };
  }

  const phoneField = params.fields.find((f) => f.fieldType === "PHONE");
  const respondentPhone = phoneField
    ? params.answers.find((a) => a.fieldKey === phoneField.fieldKey)?.value
    : undefined;

  const mergeCtx = {
    formName: params.formName,
    submittedAt: params.submittedAt,
    answers: params.answers,
  };

  let respondentStatus: SmartFormSmsStatus = "NONE";
  let smsError: string | null = null;

  if (automation.sendToRespondent) {
    if (!respondentPhone) {
      respondentStatus = "FAILED";
      smsError = "No phone number on submission.";
      await logSmsAnalytics(params.formId, params.userId, "SMS_FAILED", "respondent", {
        reason: smsError,
        responseId: params.responseId,
      });
    } else {
      const body = applySmartFormMergeTags(
        automation.respondentMessageTemplate?.trim() ||
          "Hi {{first_name}}, thank you for submitting {{form_name}}.",
        mergeCtx,
      );
      const countryCode =
        detectCountryCode(respondentPhone) ?? owner.countryCode ?? "GH";
      const result = await sendFormSms(
        params.userId,
        respondentPhone,
        body,
        automation.senderId,
        countryCode,
        `Smart Form reply: ${params.formName}`,
      );

      if (result.ok) {
        respondentStatus = "SENT";
        await logSmsAnalytics(params.formId, params.userId, "SMS_SENT", "respondent", {
          messageId: result.messageId,
          responseId: params.responseId,
        });
      } else {
        respondentStatus = "FAILED";
        smsError = result.error;
        await logSmsAnalytics(params.formId, params.userId, "SMS_FAILED", "respondent", {
          reason: result.error,
          responseId: params.responseId,
        });
      }
    }
  }

  if (automation.sendToAdmin) {
    const adminPhone = automation.adminPhone?.trim() || owner.phone;
    const body = applySmartFormMergeTags(
      automation.adminMessageTemplate?.trim() ||
        "New submission on {{form_name}} from {{name}} - {{phone}}.",
      mergeCtx,
    );
    const countryCode = detectCountryCode(adminPhone) ?? owner.countryCode ?? "GH";
    const result = await sendFormSms(
      params.userId,
      adminPhone,
      body,
      automation.senderId,
      countryCode,
      `Smart Form alert: ${params.formName}`,
    );

    if (result.ok) {
      await logSmsAnalytics(params.formId, params.userId, "SMS_SENT", "admin", {
        messageId: result.messageId,
        responseId: params.responseId,
      });
    } else {
      await logSmsAnalytics(params.formId, params.userId, "SMS_FAILED", "admin", {
        reason: result.error,
        responseId: params.responseId,
      });
      if (respondentStatus === "NONE") {
        respondentStatus = "FAILED";
        smsError = result.error;
      }
    }
  }

  return { respondentStatus, smsError };
}

export async function retryRespondentSms(
  userId: string,
  formId: string,
  responseId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const response = await prisma.smartFormResponse.findFirst({
    where: { id: responseId, formId, userId },
    include: {
      answers: true,
      form: {
        include: {
          fields: { orderBy: { sortOrder: "asc" } },
          smsAutomation: true,
        },
      },
    },
  });

  if (!response) return { ok: false, error: "Response not found." };
  if (!response.form.smsAutomation?.sendToRespondent) {
    return { ok: false, error: "Respondent SMS is not enabled for this form." };
  }

  const fields = response.form.fields.map((f) => ({
    id: f.id,
    label: f.label,
    fieldKey: f.fieldKey,
    fieldType: f.fieldType,
    isRequired: f.isRequired,
    options: [],
    sortOrder: f.sortOrder,
  }));

  const result = await runSmartFormSmsAutomation({
    formId,
    userId,
    formName: response.form.name,
    responseId,
    automation: response.form.smsAutomation,
    fields,
    answers: response.answers.map((a) => ({
      fieldKey: a.fieldKey,
      value: a.value,
    })),
    submittedAt: response.submittedAt,
  });

  await prisma.smartFormResponse.update({
    where: { id: responseId },
    data: { smsStatus: result.respondentStatus, smsError: result.smsError },
  });

  if (result.respondentStatus === "FAILED") {
    return { ok: false, error: result.smsError ?? "SMS failed." };
  }
  if (result.respondentStatus === "NONE") {
    return { ok: false, error: "SMS was not sent." };
  }
  return { ok: true };
}
