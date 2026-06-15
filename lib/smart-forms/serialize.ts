import type { Prisma } from "@/lib/generated/prisma/client";
import { parseFieldOptions } from "@/lib/smart-forms/field-meta";
import type {
  BuilderField,
  SerializedSmartForm,
  SmartFormSuccessSettings,
  SmartFormThemeSettings,
} from "@/lib/smart-forms/types";

type FormWithFields = {
  id: string;
  name: string;
  description: string | null;
  status: SerializedSmartForm["status"];
  shortCode: string;
  slug: string;
  themeSettings: Prisma.JsonValue;
  successSettings: Prisma.JsonValue;
  saveToContacts: boolean;
  contactGroupId: string | null;
  preventDuplicatePhone: boolean;
  preventDuplicateEmail: boolean;
  captchaEnabled: boolean;
  fields: Array<{
    id: string;
    label: string;
    fieldKey: string;
    fieldType: BuilderField["fieldType"];
    placeholder: string | null;
    helperText: string | null;
    isRequired: boolean;
    options: Prisma.JsonValue;
    sortOrder: number;
  }>;
};

function parseThemeSettings(raw: Prisma.JsonValue): SmartFormThemeSettings {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as SmartFormThemeSettings;
}

function parseSuccessSettings(raw: Prisma.JsonValue): SmartFormSuccessSettings {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as SmartFormSuccessSettings;
}

export function serializeSmartForm(form: FormWithFields): SerializedSmartForm {
  return {
    id: form.id,
    name: form.name,
    description: form.description,
    status: form.status,
    shortCode: form.shortCode,
    slug: form.slug,
    themeSettings: parseThemeSettings(form.themeSettings),
    successSettings: parseSuccessSettings(form.successSettings),
    saveToContacts: form.saveToContacts,
    contactGroupId: form.contactGroupId,
    preventDuplicatePhone: form.preventDuplicatePhone,
    preventDuplicateEmail: form.preventDuplicateEmail,
    captchaEnabled: form.captchaEnabled,
    fields: form.fields.map((field) => ({
      id: field.id,
      label: field.label,
      fieldKey: field.fieldKey,
      fieldType: field.fieldType,
      placeholder: field.placeholder ?? undefined,
      helperText: field.helperText ?? undefined,
      isRequired: field.isRequired,
      options: parseFieldOptions(field.options),
      sortOrder: field.sortOrder,
    })),
  };
}
