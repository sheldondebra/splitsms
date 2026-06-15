import { getFieldTypeMeta } from "@/lib/smart-forms/field-meta";
import type { BuilderField } from "@/lib/smart-forms/types";
import { validateRecipientPhone } from "@/lib/sms/phone-validation";

export type FieldErrors = Record<string, string>;

export function validateSubmissionFields(
  fields: BuilderField[],
  values: Record<string, string | string[]>,
): FieldErrors {
  const errors: FieldErrors = {};

  for (const field of fields) {
    const meta = getFieldTypeMeta(field.fieldType);
    if (!meta.isInput) continue;

    const raw = values[field.fieldKey];
    const value = Array.isArray(raw) ? raw.join(", ") : (raw ?? "").trim();

    if (field.isRequired) {
      if (field.fieldType === "CONSENT") {
        if (raw !== "yes") {
          errors[field.fieldKey] = "You must agree to continue.";
        }
        continue;
      }
      if (field.fieldType === "CHECKBOX") {
        const selected = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
        if (selected.length === 0) {
          errors[field.fieldKey] = "Select at least one option.";
        }
        continue;
      }
      if (!value) {
        errors[field.fieldKey] = `${field.label} is required.`;
        continue;
      }
    }

    if (!value && field.fieldType !== "CHECKBOX") continue;

    if (field.fieldType === "EMAIL" && value) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors[field.fieldKey] = "Enter a valid email address.";
      }
    }

    if (field.fieldType === "PHONE" && value) {
      const check = validateRecipientPhone(value);
      if (!check.valid) {
        errors[field.fieldKey] = "Enter a valid phone number.";
      }
    }

    if (field.fieldType === "NUMBER" && value) {
      if (Number.isNaN(Number(value))) {
        errors[field.fieldKey] = "Enter a valid number.";
      }
    }

    if (field.fieldType === "SELECT" || field.fieldType === "RADIO") {
      if (value && field.options.length > 0 && !field.options.includes(value)) {
        errors[field.fieldKey] = "Select a valid option.";
      }
    }

    if (field.fieldType === "CHECKBOX") {
      const selected = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
      for (const item of selected) {
        if (field.options.length > 0 && !field.options.includes(item)) {
          errors[field.fieldKey] = "Select valid options.";
          break;
        }
      }
    }
  }

  return errors;
}

export function normalizeAnswerValue(
  field: BuilderField,
  raw: string | string[] | undefined,
): string {
  if (field.fieldType === "CHECKBOX") {
    const selected = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
    return selected.join(", ");
  }
  if (field.fieldType === "CONSENT") {
    return raw === "yes" ? "yes" : "no";
  }
  if (field.fieldType === "PHONE") {
    const text = Array.isArray(raw) ? raw[0] ?? "" : (raw ?? "");
    const check = validateRecipientPhone(text);
    return check.valid ? check.normalized : text.trim();
  }
  return Array.isArray(raw) ? raw.join(", ") : (raw ?? "").trim();
}
