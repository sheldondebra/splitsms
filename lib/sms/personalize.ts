export type PersonalizationVars = {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  country?: string | null;
  email?: string | null;
};

/** Placeholder keys supported in templates (case-insensitive). */
export const TEMPLATE_VARIABLES = [
  { key: "firstName", label: "First name", example: "Kwame" },
  { key: "lastName", label: "Last name", example: "Mensah" },
  { key: "name", label: "Full name", example: "Kwame Mensah" },
  { key: "phoneNumber", label: "Phone number", example: "233201234567" },
  { key: "phone", label: "Phone (alias)", example: "233201234567" },
  { key: "email", label: "Email", example: "kwame@example.com" },
  { key: "country", label: "Country", example: "Ghana" },
] as const;

export const SMS_PREVIEW_SAMPLE: Required<
  Pick<
    PersonalizationVars,
    "name" | "firstName" | "lastName" | "phone" | "phoneNumber" | "email" | "country"
  >
> = {
  firstName: "Kwame",
  lastName: "Mensah",
  name: "Kwame Mensah",
  phone: "233201234567",
  phoneNumber: "233201234567",
  email: "kwame@example.com",
  country: "Ghana",
};

const PLACEHOLDER_KEYS = [
  "firstName",
  "lastName",
  "name",
  "phoneNumber",
  "phone",
  "email",
  "country",
] as const;

export function splitFullName(name?: string | null) {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

export function buildPersonalizationVars(
  input: PersonalizationVars & { name?: string | null },
): PersonalizationVars {
  const fromName = splitFullName(input.name);
  const firstName = input.firstName ?? fromName.firstName;
  const lastName = input.lastName ?? fromName.lastName;
  const phone = input.phone ?? input.phoneNumber ?? "";
  const phoneNumber = input.phoneNumber ?? input.phone ?? phone;
  const name =
    input.name?.trim() ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    "";

  return {
    name,
    firstName,
    lastName,
    phone,
    phoneNumber,
    email: input.email ?? "",
    country: input.country ?? "",
  };
}

export function personalizeMessage(template: string, vars: PersonalizationVars): string {
  const v = buildPersonalizationVars(vars);
  let out = template;
  for (const key of PLACEHOLDER_KEYS) {
    const value = String(v[key] ?? "");
    out = out.replace(new RegExp(`\\{${key}\\}`, "gi"), value);
  }
  return out;
}

export function extractTemplateVariables(template: string): string[] {
  const found = new Set<string>();
  const re = /\{([a-zA-Z][a-zA-Z0-9]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template)) !== null) {
    found.add(m[1]);
  }
  return [...found];
}

export const PERSONALIZATION_HINT =
  "Use placeholders like {firstName}, {lastName}, {name}, {phoneNumber}, {email}, or {country} — preview shows sample values.";
