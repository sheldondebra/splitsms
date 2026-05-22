import Papa from "papaparse";
import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";
import { detectCountryCode } from "@/lib/contacts/country-from-phone";

export type CsvContactRow = {
  name?: string;
  phone: string;
  email?: string;
  countryCode?: string;
  tags?: string;
};

export type CsvImportPreview = {
  valid: CsvContactRow[];
  invalid: { row: number; phone: string; reason: string }[];
  duplicates: number;
  totalRows: number;
};

/** Strip CSV formula injection prefixes */
function sanitizeCell(value: string): string {
  const v = value.trim().replace(/^"|"$/g, "");
  if (/^[=+\-@]/.test(v)) return v.slice(1);
  return v;
}

function normalizePhone(raw: string): string | null {
  const cleaned = raw.replace(/\s+/g, "");
  const withPlus = cleaned.startsWith("+") ? cleaned : `+${cleaned.replace(/^0+/, "")}`;
  try {
    if (!isValidPhoneNumber(withPlus)) return null;
    const p = parsePhoneNumber(withPlus);
    return p.format("E.164");
  } catch {
    return null;
  }
}

export function parseContactsCsv(text: string): CsvImportPreview {
  const parsed = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const valid: CsvContactRow[] = [];
  const invalid: CsvImportPreview["invalid"] = [];
  const seen = new Set<string>();
  let duplicates = 0;

  const rows = parsed.data.length > 0 ? parsed.data : fallbackNoHeader(text);

  rows.forEach((row, idx) => {
    const phoneRaw = sanitizeCell(
      row.phone ?? row.msisdn ?? row.mobile ?? row.number ?? Object.values(row)[0] ?? "",
    );
    if (!phoneRaw) {
      invalid.push({ row: idx + 1, phone: "", reason: "Missing phone" });
      return;
    }

    const phone = normalizePhone(phoneRaw);
    if (!phone) {
      invalid.push({ row: idx + 1, phone: phoneRaw, reason: "Invalid number" });
      return;
    }

    if (seen.has(phone)) {
      duplicates++;
      return;
    }
    seen.add(phone);

    const countryRaw = row.country ?? row.countrycode ?? row.country_code;
    valid.push({
      name: sanitizeCell(row.name ?? row.fullname ?? "") || undefined,
      phone,
      email: sanitizeCell(row.email ?? "") || undefined,
      countryCode: countryRaw
        ? sanitizeCell(countryRaw).toUpperCase().slice(0, 2)
        : detectCountryCode(phone),
      tags: sanitizeCell(row.tags ?? row.tag ?? "") || undefined,
    });
  });

  return {
    valid,
    invalid,
    duplicates,
    totalRows: rows.length,
  };
}

function fallbackNoHeader(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  return lines.map((line) => {
    const cols = line.split(",").map((c) => sanitizeCell(c));
    return {
      phone: cols[0] ?? "",
      name: cols[1],
      tags: cols[2],
    };
  });
}
