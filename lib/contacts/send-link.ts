type ContactSendTarget = {
  phone: string;
  countryCode?: string | null;
};

export function parseSendToParam(to?: string): string {
  if (!to?.trim()) return "";
  return to
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join("\n");
}

export function buildSendToContactsUrl(contacts: ContactSendTarget[]): string {
  const params = new URLSearchParams();
  const phones = contacts.map((c) => c.phone).filter(Boolean);
  if (phones.length === 0) return "/dashboard/send";

  params.set("to", phones.join(","));
  const countries = [...new Set(contacts.map((c) => c.countryCode).filter(Boolean))] as string[];
  if (countries.length === 1) params.set("country", countries[0]);

  return `/dashboard/send?${params.toString()}`;
}

export function buildSendToContactUrl(contact: ContactSendTarget): string {
  return buildSendToContactsUrl([contact]);
}
