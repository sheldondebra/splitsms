import { normalizePhones } from "@/lib/sms/units";
import type { CsvContactRow } from "@/lib/contacts/csv-import";
import { detectCountryCode } from "@/lib/contacts/country-from-phone";

export type GooglePersonContact = {
  resourceName: string;
  name: string | null;
  email: string | null;
  phone: string;
  countryCode: string | null;
};

type PeopleListResponse = {
  connections?: Array<{
    resourceName?: string;
    names?: Array<{ displayName?: string; givenName?: string; familyName?: string }>;
    emailAddresses?: Array<{ value?: string }>;
    phoneNumbers?: Array<{ value?: string; canonicalForm?: string }>;
  }>;
  nextPageToken?: string;
};

function displayName(person: NonNullable<PeopleListResponse["connections"]>[number]) {
  const n = person.names?.[0];
  if (!n) return null;
  const full = String(n.displayName ?? "").trim();
  if (full) return full;
  const parts = [n.givenName, n.familyName].filter(Boolean).join(" ").trim();
  return parts || null;
}

function pickPhone(person: NonNullable<PeopleListResponse["connections"]>[number]) {
  const numbers = person.phoneNumbers ?? [];
  for (const entry of numbers) {
    const candidates = [entry.canonicalForm, entry.value].filter(Boolean) as string[];
    for (const raw of candidates) {
      const phone = normalizePhones(raw)[0];
      if (phone) return phone;
    }
  }
  return null;
}

export function mapGooglePersonToContact(
  person: NonNullable<PeopleListResponse["connections"]>[number],
): GooglePersonContact | null {
  const phone = pickPhone(person);
  if (!phone) return null;
  const resourceName = String(person.resourceName ?? "").trim();
  if (!resourceName) return null;
  const email = String(person.emailAddresses?.[0]?.value ?? "")
    .trim()
    .toLowerCase() || null;
  return {
    resourceName,
    name: displayName(person),
    email,
    phone,
    countryCode: detectCountryCode(phone) ?? null,
  };
}

export async function listGoogleContactsWithPhones(
  accessToken: string,
  opts?: { pageSize?: number; maxPages?: number },
): Promise<GooglePersonContact[]> {
  const pageSize = Math.min(Math.max(opts?.pageSize ?? 200, 1), 1000);
  const maxPages = opts?.maxPages ?? 10;
  const out: GooglePersonContact[] = [];
  const seenPhones = new Set<string>();
  let pageToken: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({
      personFields: "names,emailAddresses,phoneNumbers",
      pageSize: String(pageSize),
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(
      `https://people.googleapis.com/v1/people/me/connections?${params}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      },
    );

    if (!res.ok) {
      throw new Error(`people_list_${res.status}`);
    }

    const data = (await res.json()) as PeopleListResponse;
    for (const person of data.connections ?? []) {
      const mapped = mapGooglePersonToContact(person);
      if (!mapped) continue;
      if (seenPhones.has(mapped.phone)) continue;
      seenPhones.add(mapped.phone);
      out.push(mapped);
    }

    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  return out;
}

export function toCsvContactRows(contacts: GooglePersonContact[]): CsvContactRow[] {
  return contacts.map((c) => ({
    phone: c.phone,
    name: c.name ?? undefined,
    email: c.email ?? undefined,
    countryCode: c.countryCode ?? undefined,
  }));
}

export async function createGoogleContact(
  accessToken: string,
  contact: { name?: string | null; phone: string; email?: string | null },
): Promise<{ ok: true; resourceName: string } | { ok: false; error: string }> {
  const body: Record<string, unknown> = {
    phoneNumbers: [{ value: contact.phone }],
  };
  if (contact.name?.trim()) {
    body.names = [{ givenName: contact.name.trim() }];
  }
  if (contact.email?.trim()) {
    body.emailAddresses = [{ value: contact.email.trim() }];
  }

  const res = await fetch("https://people.googleapis.com/v1/people:createContact", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return { ok: false, error: `create_${res.status}` };
  }

  const data = (await res.json()) as { resourceName?: string };
  if (!data.resourceName) return { ok: false, error: "create_missing_resource" };
  return { ok: true, resourceName: data.resourceName };
}
