"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { getFormTemplate } from "@/lib/smart-forms/templates";
import { generateUniqueShortCode, generateUniqueSlug } from "@/lib/smart-forms/short-code";
import { serializeSmartForm } from "@/lib/smart-forms/serialize";
import { getFieldTypeMeta } from "@/lib/smart-forms/field-meta";
import { assertCanCreateSmartForm } from "@/lib/smart-forms/limits";
import type { SaveBuilderPayload, BuilderField } from "@/lib/smart-forms/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const fieldSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  fieldKey: z.string().min(1).max(64),
  fieldType: z.enum([
    "TEXT",
    "TEXTAREA",
    "PHONE",
    "EMAIL",
    "NUMBER",
    "SELECT",
    "RADIO",
    "CHECKBOX",
    "DATE",
    "TIME",
    "CONSENT",
    "SECTION",
    "DIVIDER",
  ]),
  placeholder: z.string().optional(),
  helperText: z.string().optional(),
  isRequired: z.boolean(),
  options: z.array(z.string()),
  sortOrder: z.number().int().min(0),
});

const saveBuilderSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000),
  themeSettings: z.object({
    primaryColor: z.string().optional(),
    buttonText: z.string().optional(),
    buttonRadius: z.string().optional(),
    backgroundColor: z.string().optional(),
    showBranding: z.boolean().optional(),
  }),
  successSettings: z.object({
    title: z.string().optional(),
    message: z.string().optional(),
    redirectUrl: z.string().optional(),
    redirectDelayMs: z.number().optional(),
  }),
  saveToContacts: z.boolean(),
  contactGroupId: z.string().nullable(),
  preventDuplicatePhone: z.boolean(),
  preventDuplicateEmail: z.boolean(),
  captchaEnabled: z.boolean().optional(),
  fields: z.array(fieldSchema),
});

async function requireOwnedForm(userId: string, formId: string) {
  const form = await prisma.smartForm.findFirst({
    where: { id: formId, userId },
    select: { id: true },
  });
  if (!form) throw new Error("Form not found");
  return form;
}

export async function createSmartFormAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const canCreate = await assertCanCreateSmartForm(session.userId, session.role as import("@/lib/generated/prisma/client").UserRole);
  if (!canCreate.ok) redirect(`/dashboard/forms/create?error=limit`);

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || undefined;
  const templateId = String(formData.get("templateId") ?? "blank");
  const contactGroupId = String(formData.get("contactGroupId") ?? "") || undefined;
  const saveToContacts = formData.get("saveToContacts") === "on";

  if (!name) redirect("/dashboard/forms/create?error=name");

  const template = getFormTemplate(templateId);
  const [shortCode, slug] = await Promise.all([
    generateUniqueShortCode(),
    generateUniqueSlug(session.userId, name),
  ]);

  const form = await prisma.smartForm.create({
    data: {
      userId: session.userId,
      name,
      slug,
      shortCode,
      description,
      contactGroupId,
      saveToContacts: saveToContacts || Boolean(contactGroupId),
      fields: {
        create: template.fields.map((field, index) => ({
          label: field.label,
          fieldKey: field.fieldKey,
          fieldType: field.fieldType,
          placeholder: field.placeholder,
          helperText: field.helperText,
          isRequired: field.isRequired ?? false,
          options: field.options ? field.options : undefined,
          sortOrder: index,
        })),
      },
    },
  });

  revalidatePath("/dashboard/forms");
  redirect(`/dashboard/forms/${form.id}/builder`);
}

export async function createSmartFormFromTemplateAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const canCreate = await assertCanCreateSmartForm(session.userId, session.role as import("@/lib/generated/prisma/client").UserRole);
  if (!canCreate.ok) redirect("/dashboard/forms/templates?error=limit");

  const templateId = String(formData.get("templateId") ?? "blank");
  const name = String(formData.get("name") ?? "").trim() || "New form";
  const template = getFormTemplate(templateId);

  const [shortCode, slug] = await Promise.all([
    generateUniqueShortCode(),
    generateUniqueSlug(session.userId, name),
  ]);

  const form = await prisma.smartForm.create({
    data: {
      userId: session.userId,
      name,
      slug,
      shortCode,
      description: template.description,
      fields: {
        create: template.fields.map((field, index) => ({
          label: field.label,
          fieldKey: field.fieldKey,
          fieldType: field.fieldType,
          placeholder: field.placeholder,
          helperText: field.helperText,
          isRequired: field.isRequired ?? false,
          options: field.options ? field.options : undefined,
          sortOrder: index,
        })),
      },
    },
  });

  revalidatePath("/dashboard/forms");
  redirect(`/dashboard/forms/${form.id}/builder`);
}

export async function duplicateSmartFormAction(
  formId: string,
): Promise<{ ok: true; newFormId: string } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not signed in." };

  const canCreate = await assertCanCreateSmartForm(session.userId, session.role as import("@/lib/generated/prisma/client").UserRole);
  if (!canCreate.ok) return canCreate;

  const source = await prisma.smartForm.findFirst({
    where: { id: formId, userId: session.userId },
    include: {
      fields: { orderBy: { sortOrder: "asc" } },
      smsAutomation: true,
    },
  });
  if (!source) return { ok: false, error: "Form not found." };

  const baseName = source.name.replace(/\s*\(copy(?:\s*\d+)?\)\s*$/i, "").trim() || source.name;
  const name = `${baseName} (copy)`;
  const [shortCode, slug] = await Promise.all([
    generateUniqueShortCode(),
    generateUniqueSlug(session.userId, name),
  ]);

  const copy = await prisma.smartForm.create({
    data: {
      userId: session.userId,
      name,
      slug,
      shortCode,
      description: source.description,
      status: "DRAFT",
      themeSettings: source.themeSettings ?? undefined,
      layoutSettings: source.layoutSettings ?? undefined,
      successSettings: source.successSettings ?? undefined,
      contactGroupId: source.contactGroupId,
      saveToContacts: source.saveToContacts,
      preventDuplicatePhone: source.preventDuplicatePhone,
      preventDuplicateEmail: source.preventDuplicateEmail,
      captchaEnabled: source.captchaEnabled,
      fields: {
        create: source.fields.map((field) => ({
          label: field.label,
          fieldKey: field.fieldKey,
          fieldType: field.fieldType,
          placeholder: field.placeholder,
          helperText: field.helperText,
          defaultValue: field.defaultValue,
          isRequired: field.isRequired,
          options: field.options ?? undefined,
          validationRules: field.validationRules ?? undefined,
          sortOrder: field.sortOrder,
        })),
      },
      ...(source.smsAutomation
        ? {
            smsAutomation: {
              create: {
                sendToRespondent: source.smsAutomation.sendToRespondent,
                sendToAdmin: source.smsAutomation.sendToAdmin,
                adminPhone: source.smsAutomation.adminPhone,
                senderId: source.smsAutomation.senderId,
                respondentMessageTemplate: source.smsAutomation.respondentMessageTemplate,
                adminMessageTemplate: source.smsAutomation.adminMessageTemplate,
              },
            },
          }
        : {}),
    },
  });

  revalidatePath("/dashboard/forms");
  return { ok: true, newFormId: copy.id };
}

export async function saveSmartFormBuilderAction(
  formId: string,
  payloadJson: string,
): Promise<{ ok: true; fields: BuilderField[] } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not signed in." };

  let payload: SaveBuilderPayload;
  try {
    payload = saveBuilderSchema.parse(JSON.parse(payloadJson)) as SaveBuilderPayload;
  } catch {
    return { ok: false, error: "Invalid form data." };
  }

  try {
    await requireOwnedForm(session.userId, formId);
  } catch {
    return { ok: false, error: "Form not found." };
  }

  const keys = payload.fields.map((f) => f.fieldKey);
  if (new Set(keys).size !== keys.length) {
    return { ok: false, error: "Field keys must be unique." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.smartForm.update({
      where: { id: formId },
      data: {
        name: payload.name.trim(),
        description: payload.description.trim() || null,
        themeSettings: payload.themeSettings,
        successSettings: payload.successSettings,
        saveToContacts: payload.saveToContacts,
        contactGroupId: payload.contactGroupId || null,
        preventDuplicatePhone: payload.preventDuplicatePhone,
        preventDuplicateEmail: payload.preventDuplicateEmail,
        captchaEnabled: payload.captchaEnabled ?? false,
      },
    });

    const existingFields = await tx.smartFormField.findMany({
      where: { formId },
      select: { id: true },
    });
    const existingIds = new Set(existingFields.map((f) => f.id));
    const keepIds = new Set<string>();

    for (const field of payload.fields) {
      const isNew = field.id.startsWith("new_") || !existingIds.has(field.id);
      const data = {
        label: field.label.trim(),
        fieldKey: field.fieldKey.trim(),
        fieldType: field.fieldType,
        placeholder: field.placeholder?.trim() || null,
        helperText: field.helperText?.trim() || null,
        isRequired: field.isRequired,
        options: field.options.length > 0 ? field.options : undefined,
        sortOrder: field.sortOrder,
      };

      if (isNew) {
        await tx.smartFormField.create({ data: { formId, ...data } });
      } else {
        keepIds.add(field.id);
        await tx.smartFormField.update({ where: { id: field.id }, data });
      }
    }

    const deleteIds = [...existingIds].filter((id) => !keepIds.has(id));
    if (deleteIds.length > 0) {
      await tx.smartFormField.deleteMany({ where: { id: { in: deleteIds } } });
    }
  });

  revalidatePath(`/dashboard/forms/${formId}/builder`);
  revalidatePath("/dashboard/forms");

  const updated = await prisma.smartForm.findFirst({
    where: { id: formId },
    include: { fields: { orderBy: { sortOrder: "asc" } } },
  });
  if (!updated) return { ok: false, error: "Form not found." };

  return { ok: true, fields: serializeSmartForm(updated).fields };
}

export async function publishSmartFormAction(
  formId: string,
): Promise<{ ok: true; shortCode: string } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not signed in." };

  const form = await prisma.smartForm.findFirst({
    where: { id: formId, userId: session.userId },
    include: { fields: true },
  });
  if (!form) return { ok: false, error: "Form not found." };

  const hasInput = form.fields.some((f) => getFieldTypeMeta(f.fieldType).isInput);
  if (!hasInput) {
    return { ok: false, error: "Add at least one input field before publishing." };
  }

  await prisma.smartForm.update({
    where: { id: formId },
    data: {
      status: "PUBLISHED",
      publishedAt: form.publishedAt ?? new Date(),
      closedAt: null,
    },
  });

  revalidatePath(`/dashboard/forms/${formId}/builder`);
  revalidatePath("/dashboard/forms");
  return { ok: true, shortCode: form.shortCode };
}

export async function closeSmartFormAction(formId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not signed in." };

  try {
    await requireOwnedForm(session.userId, formId);
  } catch {
    return { ok: false, error: "Form not found." };
  }

  await prisma.smartForm.update({
    where: { id: formId },
    data: { status: "CLOSED", closedAt: new Date() },
  });

  revalidatePath(`/dashboard/forms/${formId}/builder`);
  revalidatePath("/dashboard/forms");
  return { ok: true };
}

export async function reopenSmartFormAction(formId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not signed in." };

  try {
    await requireOwnedForm(session.userId, formId);
  } catch {
    return { ok: false, error: "Form not found." };
  }

  await prisma.smartForm.update({
    where: { id: formId },
    data: { status: "PUBLISHED", closedAt: null },
  });

  revalidatePath(`/dashboard/forms/${formId}/builder`);
  revalidatePath("/dashboard/forms");
  return { ok: true };
}

export async function deleteSmartFormAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/dashboard/forms?error=invalid");

  const form = await prisma.smartForm.findFirst({
    where: { id, userId: session.userId },
    select: { id: true },
  });
  if (!form) redirect("/dashboard/forms?error=notfound");

  await prisma.smartForm.delete({ where: { id } });
  revalidatePath("/dashboard/forms");
  redirect("/dashboard/forms?deleted=1");
}
