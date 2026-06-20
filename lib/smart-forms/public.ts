import { createHash } from "crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { serializeSmartForm } from "@/lib/smart-forms/serialize";
import { analyticsEventForSource } from "@/lib/smart-forms/share";
import { parseDeviceType } from "@/lib/smart-forms/device";
import type { PublicSmartForm } from "@/lib/smart-forms/types";
import {
  normalizeAnswerValue,
  validateSubmissionFields,
} from "@/lib/smart-forms/validate-submission";
import { getFieldTypeMeta } from "@/lib/smart-forms/field-meta";
import { saveRespondentAsContact } from "@/lib/smart-forms/save-contact";
import { runSmartFormSmsAutomation } from "@/lib/smart-forms/sms-automation";
import { applySmartFormMergeTags } from "@/lib/smart-forms/merge-tags";
import { isSubmissionRateLimited } from "@/lib/smart-forms/limits";
import { verifyCaptchaChallenge } from "@/lib/smart-forms/captcha";
import type { SmartFormAnalyticsEventType } from "@/lib/generated/prisma/client";

function hashIp(ip: string): string {
  const salt = process.env.SESSION_SECRET ?? "splitsms";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export async function getRequestMeta() {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown";
  return {
    ipHash: hashIp(ip),
    userAgent: h.get("user-agent") ?? undefined,
    referrer: h.get("referer") ?? undefined,
  };
}

export async function getPublishedSmartFormByShortCode(shortCodeOrSlug: string) {
  const form = await prisma.smartForm.findFirst({
    where: {
      status: "PUBLISHED",
      OR: [{ shortCode: shortCodeOrSlug }, { slug: shortCodeOrSlug }],
    },
    include: { fields: { orderBy: { sortOrder: "asc" } } },
  });
  if (!form) return null;

  if (form.endsAt && form.endsAt < new Date()) return null;
  if (form.startsAt && form.startsAt > new Date()) return null;

  const serialized = serializeSmartForm(form);
  const publicForm: PublicSmartForm = {
    id: serialized.id,
    name: serialized.name,
    description: serialized.description,
    shortCode: serialized.shortCode,
    status: serialized.status,
    bannerUrl: serialized.bannerUrl,
    themeSettings: serialized.themeSettings,
    layoutSettings: serialized.layoutSettings,
    successSettings: serialized.successSettings,
    captchaEnabled: serialized.captchaEnabled,
    fields: serialized.fields,
  };

  return { form, publicForm };
}

export async function getSmartFormForPreview(userId: string, formId: string) {
  const form = await prisma.smartForm.findFirst({
    where: { id: formId, userId },
    include: { fields: { orderBy: { sortOrder: "asc" } } },
  });
  if (!form) return null;
  const serialized = serializeSmartForm(form);
  const publicForm: PublicSmartForm = {
    id: serialized.id,
    name: serialized.name,
    description: serialized.description,
    shortCode: serialized.shortCode,
    status: serialized.status,
    bannerUrl: serialized.bannerUrl,
    themeSettings: serialized.themeSettings,
    layoutSettings: serialized.layoutSettings,
    successSettings: serialized.successSettings,
    captchaEnabled: serialized.captchaEnabled,
    fields: serialized.fields,
  };
  return publicForm;
}

export async function recordSmartFormEvent(
  formId: string,
  userId: string,
  eventType: SmartFormAnalyticsEventType,
  meta?: { source?: string; deviceType?: string },
) {
  const requestMeta = await getRequestMeta();
  const deviceType = parseDeviceType(requestMeta.userAgent);
  await prisma.smartFormAnalyticsEvent.create({
    data: {
      formId,
      userId,
      eventType,
      source: meta?.source,
      deviceType: meta?.deviceType ?? deviceType,
      referrer: requestMeta.referrer,
      ipHash: requestMeta.ipHash,
      userAgent: requestMeta.userAgent,
    },
  });
}

export async function recordSmartFormOpen(
  formId: string,
  userId: string,
  source: string | undefined,
  context: "page" | "embed",
) {
  const eventType = analyticsEventForSource(source, context);
  await recordSmartFormEvent(formId, userId, eventType, { source: source ?? context });

  if (context === "page") {
    await recordSmartFormEvent(formId, userId, "VIEW", { source: source ?? "direct" });
  }
}

export type SubmitSmartFormInput = {
  shortCode: string;
  values: Record<string, string | string[]>;
  honeypot?: string;
  source?: string;
  captcha?: { a: number; b: number; answer: number; token: string };
};

export type SubmitSmartFormResult =
  | { ok: true; successTitle: string; successMessage: string; redirectUrl?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function submitSmartFormResponse(
  input: SubmitSmartFormInput,
): Promise<SubmitSmartFormResult> {
  if (input.honeypot) {
    return { ok: false, error: "Submission rejected." };
  }

  const found = await getPublishedSmartFormByShortCode(input.shortCode);
  if (!found) {
    return { ok: false, error: "This form is not available." };
  }

  const { form, publicForm } = found;

  const requestMeta = await getRequestMeta();

  if (await isSubmissionRateLimited(form.id, requestMeta.ipHash)) {
    return { ok: false, error: "Too many submissions. Please try again later." };
  }

  if (form.captchaEnabled) {
    const captcha = input.captcha;
    if (
      !captcha ||
      !verifyCaptchaChallenge(captcha.a, captcha.b, captcha.answer, captcha.token)
    ) {
      return { ok: false, error: "Incorrect security check. Please try again." };
    }
  }

  if (form.submissionLimit != null) {
    const count = await prisma.smartFormResponse.count({ where: { formId: form.id } });
    if (count >= form.submissionLimit) {
      return { ok: false, error: "This form is no longer accepting submissions." };
    }
  }

  const fieldErrors = validateSubmissionFields(publicForm.fields, input.values);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "Please fix the errors below.", fieldErrors };
  }

  const phoneField = publicForm.fields.find((f) => f.fieldType === "PHONE");
  const emailField = publicForm.fields.find((f) => f.fieldType === "EMAIL");
  const phoneValue = phoneField
    ? normalizeAnswerValue(phoneField, input.values[phoneField.fieldKey])
    : "";
  const emailValue = emailField
    ? normalizeAnswerValue(emailField, input.values[emailField.fieldKey])
    : "";

  if (form.preventDuplicatePhone && phoneValue) {
    const dup = await prisma.smartFormResponseAnswer.findFirst({
      where: {
        fieldKey: phoneField?.fieldKey,
        value: phoneValue,
        response: { formId: form.id },
      },
    });
    if (dup) {
      return {
        ok: false,
        error: "This phone number has already been used on this form.",
        fieldErrors: phoneField ? { [phoneField.fieldKey]: "Duplicate phone number." } : undefined,
      };
    }
  }

  if (form.preventDuplicateEmail && emailValue) {
    const dup = await prisma.smartFormResponseAnswer.findFirst({
      where: {
        fieldKey: emailField?.fieldKey,
        value: emailValue,
        response: { formId: form.id },
      },
    });
    if (dup) {
      return {
        ok: false,
        error: "This email has already been used on this form.",
        fieldErrors: emailField ? { [emailField.fieldKey]: "Duplicate email." } : undefined,
      };
    }
  }

  const inputFields = publicForm.fields.filter((f) => getFieldTypeMeta(f.fieldType).isInput);

  const answerRows = inputFields.map((field) => ({
    fieldId: field.id.startsWith("new_") ? null : field.id,
    fieldKey: field.fieldKey,
    fieldLabel: field.label,
    value: normalizeAnswerValue(field, input.values[field.fieldKey]),
  }));

  const submittedAt = new Date();

  const responseId = await prisma.$transaction(async (tx) => {
    const response = await tx.smartFormResponse.create({
      data: {
        formId: form.id,
        userId: form.userId,
        source: input.source ?? "public",
        ipHash: requestMeta.ipHash,
        userAgent: requestMeta.userAgent,
        referrer: requestMeta.referrer,
        contactSaveStatus: "PENDING",
        smsStatus: "NONE",
        submittedAt,
      },
    });

    await tx.smartFormResponseAnswer.createMany({
      data: answerRows.map((row) => ({ ...row, responseId: response.id })),
    });

    const contactResult = await saveRespondentAsContact({
      tx,
      userId: form.userId,
      form: {
        saveToContacts: form.saveToContacts,
        contactGroupId: form.contactGroupId,
      },
      fields: publicForm.fields,
      answers: answerRows,
    });

    await tx.smartFormResponse.update({
      where: { id: response.id },
      data: {
        contactId: contactResult.contactId ?? null,
        contactSaveStatus: contactResult.status,
      },
    });

    await tx.smartFormAnalyticsEvent.create({
      data: {
        formId: form.id,
        userId: form.userId,
        eventType: "SUBMIT",
        source: input.source ?? "public",
        referrer: requestMeta.referrer,
        ipHash: requestMeta.ipHash,
        userAgent: requestMeta.userAgent,
      },
    });

    if (contactResult.status === "SAVED") {
      await tx.smartFormAnalyticsEvent.create({
        data: {
          formId: form.id,
          userId: form.userId,
          eventType: "CONTACT_SAVED",
          source: input.source ?? "public",
          ipHash: requestMeta.ipHash,
        },
      });
    }

    return response.id;
  });

  const automation = await prisma.smartFormSmsAutomation.findUnique({
    where: { formId: form.id },
  });

  const smsResult = await runSmartFormSmsAutomation({
    formId: form.id,
    userId: form.userId,
    formName: form.name,
    responseId,
    automation,
    fields: publicForm.fields,
    answers: answerRows,
    submittedAt,
  });

  if (smsResult.respondentStatus !== "NONE") {
    await prisma.smartFormResponse.update({
      where: { id: responseId },
      data: {
        smsStatus: smsResult.respondentStatus,
        smsError: smsResult.smsError,
      },
    });
  }

  const successSettings = publicForm.successSettings;
  const mergeCtx = {
    formName: form.name,
    submittedAt,
    fields: publicForm.fields,
    answers: answerRows.map((answer) => ({
      fieldKey: answer.fieldKey,
      value: answer.value,
    })),
  };
  const successTitle = applySmartFormMergeTags(successSettings.title ?? "Thank you", mergeCtx);
  const successMessage = applySmartFormMergeTags(
    successSettings.message ?? "Your submission has been received. We will be in touch soon.",
    mergeCtx,
  );

  return {
    ok: true,
    successTitle,
    successMessage,
    redirectUrl: successSettings.redirectUrl,
  };
}
