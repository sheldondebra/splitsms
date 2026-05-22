export type PersonalizationVars = {
  name?: string | null;
  phone?: string;
  country?: string | null;
  email?: string | null;
};

const VARS = ["name", "phone", "country", "email"] as const;

export function personalizeMessage(template: string, vars: PersonalizationVars): string {
  let out = template;
  for (const key of VARS) {
    const value = vars[key] ?? "";
    out = out.replace(new RegExp(`\\{${key}\\}`, "gi"), value);
  }
  return out;
}

export const PERSONALIZATION_HINT =
  "Use {name}, {phone}, {country}, or {email} in your message.";
