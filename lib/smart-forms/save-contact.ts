import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { detectCountryCode } from "@/lib/contacts/country-from-phone";
import { runContactSignupAutomations } from "@/lib/automation/dispatch";
import type { BuilderField } from "@/lib/smart-forms/types";
import type { SmartFormContactSaveStatus } from "@/lib/generated/prisma/client";

type AnswerRow = { fieldKey: string; fieldLabel: string; value: string };

type SaveContactParams = {
  tx?: Prisma.TransactionClient;
  userId: string;
  form: {
    saveToContacts: boolean;
    contactGroupId: string | null;
  };
  fields: BuilderField[];
  answers: AnswerRow[];
};

type SaveContactResult = {
  status: SmartFormContactSaveStatus;
  contactId?: string;
};

const NAME_KEYS = ["full_name", "name", "guardian_name", "student_name"];

function findAnswer(answers: AnswerRow[], keys: string[]) {
  for (const key of keys) {
    const hit = answers.find((a) => a.fieldKey === key && a.value);
    if (hit) return hit.value;
  }
  const nameField = answers.find(
    (a) => a.fieldKey.includes("name") && a.value && !a.fieldKey.includes("user"),
  );
  return nameField?.value;
}

export async function saveRespondentAsContact(
  params: SaveContactParams,
): Promise<SaveContactResult> {
  if (!params.form.saveToContacts) {
    return { status: "SKIPPED" };
  }

  const phoneField = params.fields.find((f) => f.fieldType === "PHONE");
  const phoneAnswer = phoneField
    ? params.answers.find((a) => a.fieldKey === phoneField.fieldKey)?.value
    : params.answers.find((a) => a.value.startsWith("+"))?.value;

  if (!phoneAnswer) {
    return { status: "FAILED" };
  }

  const phone = phoneAnswer.startsWith("+") ? phoneAnswer : `+${phoneAnswer.replace(/^0+/, "")}`;
  const emailField = params.fields.find((f) => f.fieldType === "EMAIL");
  const email = emailField
    ? params.answers.find((a) => a.fieldKey === emailField.fieldKey)?.value
    : undefined;
  const name = findAnswer(params.answers, NAME_KEYS);
  const countryCode = detectCountryCode(phone);

  const db = params.tx ?? prisma;

  const existing = await db.contact.findUnique({
    where: { userId_phone: { userId: params.userId, phone } },
  });

  const contact = await db.contact.upsert({
    where: { userId_phone: { userId: params.userId, phone } },
    update: {
      name: name ?? undefined,
      email: email || undefined,
      countryCode,
      tags: existing?.tags?.includes("smart-form")
        ? existing.tags
        : [existing?.tags, "smart-form"].filter(Boolean).join(", "),
    },
    create: {
      userId: params.userId,
      phone,
      name,
      email: email || undefined,
      countryCode,
      tags: "smart-form",
    },
  });

  if (params.form.contactGroupId) {
    await db.contactGroupMember.upsert({
      where: {
        groupId_contactId: {
          groupId: params.form.contactGroupId,
          contactId: contact.id,
        },
      },
      update: {},
      create: {
        groupId: params.form.contactGroupId,
        contactId: contact.id,
      },
    });
  }

  if (!existing) {
    void runContactSignupAutomations(params.userId, {
      phone,
      name,
      email,
      countryCode,
    });
  }

  return { status: "SAVED", contactId: contact.id };
}

export async function saveResponseAsContact(
  userId: string,
  responseId: string,
): Promise<SaveContactResult> {
  const response = await prisma.smartFormResponse.findFirst({
    where: { id: responseId, userId },
    include: {
      answers: true,
      form: { include: { fields: { orderBy: { sortOrder: "asc" } } } },
    },
  });
  if (!response) return { status: "FAILED" };

  const fields = response.form.fields.map((f) => ({
    id: f.id,
    label: f.label,
    fieldKey: f.fieldKey,
    fieldType: f.fieldType,
    isRequired: f.isRequired,
    options: [],
    sortOrder: f.sortOrder,
  }));

  const result = await saveRespondentAsContact({
    userId,
    form: {
      saveToContacts: true,
      contactGroupId: response.form.contactGroupId,
    },
    fields,
    answers: response.answers.map((a) => ({
      fieldKey: a.fieldKey,
      fieldLabel: a.fieldLabel,
      value: a.value,
    })),
  });

  await prisma.smartFormResponse.update({
    where: { id: responseId },
    data: {
      contactId: result.contactId ?? null,
      contactSaveStatus: result.status,
    },
  });

  return result;
}
