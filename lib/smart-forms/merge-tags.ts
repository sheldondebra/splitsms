import { splitFullName } from "@/lib/sms/personalize";
import { personalizeMessage } from "@/lib/sms/personalize";
import type { BuilderField } from "@/lib/smart-forms/types";

export const SMART_FORM_MERGE_TAGS = [
  { tag: "{{name}}", desc: "Respondent full name" },
  { tag: "{{first_name}}", desc: "First name" },
  { tag: "{{last_name}}", desc: "Last name" },
  { tag: "{{phone}}", desc: "Phone number" },
  { tag: "{{email}}", desc: "Email address" },
  { tag: "{{form_name}}", desc: "Form title" },
  { tag: "{{submission_date}}", desc: "Submission date" },
  { tag: "{{submission_time}}", desc: "Submission time" },
  { tag: "{{field_key}}", desc: "Any field key, e.g. {{product}}" },
] as const;

export const DEFAULT_RESPONDENT_SMS =
  "Hi {{first_name}}, thank you for submitting {{form_name}}. We have received your details.";

export const DEFAULT_ADMIN_SMS =
  "New submission on {{form_name}} from {{name}} - {{phone}}.";

function answerMap(answers: { fieldKey: string; value: string }[]) {
  return new Map(answers.map((a) => [a.fieldKey, a.value]));
}

function pickName(map: Map<string, string>) {
  return (
    map.get("full_name") ??
    map.get("name") ??
    map.get("guardian_name") ??
    [...map.entries()].find(([k]) => k.includes("name"))?.[1] ??
    ""
  );
}

export function applySmartFormMergeTags(
  template: string,
  ctx: {
    formName: string;
    submittedAt: Date;
    answers: { fieldKey: string; value: string }[];
    fields?: Array<Pick<BuilderField, "fieldKey" | "dynamicValue">>;
  },
): string {
  const map = answerMap(ctx.answers);
  const dynamicValues: Record<string, string> = {};
  ctx.fields?.forEach((field) => {
    if (!field.dynamicValue) return;
    const value = map.get(field.fieldKey);
    if (value) dynamicValues[field.dynamicValue] = value;
  });

  const name = dynamicValues.name ?? pickName(map);
  const { firstName, lastName } = splitFullName(name);
  const phone = dynamicValues.phone ?? map.get("phone") ?? "";
  const email = dynamicValues.email ?? map.get("email") ?? "";

  const base: Record<string, string> = {
    name,
    first_name: dynamicValues.first_name ?? firstName,
    last_name: dynamicValues.last_name ?? lastName,
    firstname: firstName,
    lastname: lastName,
    phone,
    email,
    form_name: ctx.formName,
    submission_date: ctx.submittedAt.toLocaleDateString(),
    submission_time: ctx.submittedAt.toLocaleTimeString(),
  };

  for (const [key, value] of map.entries()) {
    base[key] = value;
  }
  for (const [key, value] of Object.entries(dynamicValues)) {
    base[key] = value;
  }

  let out = template;
  for (const [key, value] of Object.entries(base)) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`\\{\\{\\s*${escaped}\\s*\\}\\}`, "gi"), value);
  }

  return personalizeMessage(out, {
    name,
    firstName,
    lastName,
    phone,
    phoneNumber: phone.replace(/^\+/, ""),
    email,
  });
}
