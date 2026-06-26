import Papa from "papaparse";
import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";
import * as XLSX from "xlsx";
import { detectCountryCode } from "@/lib/contacts/country-from-phone";

export type CsvContactRow = {
  name?: string;
  phone: string;
  email?: string;
  countryCode?: string;
  tags?: string;
};

export type ImportPreviewRow = {
  rowIndex: number;
  status: "valid" | "invalid";
  reason?: string;
  name?: string;
  phone: string;
  phoneRaw: string;
  email?: string;
  countryCode?: string;
  tags?: string;
};

export type ContactImportPreview = {
  rows: ImportPreviewRow[];
  valid: CsvContactRow[];
  invalid: { row: number; phone: string; reason: string }[];
  duplicates: number;
  totalRows: number;
};

const EXCEL_EXTENSIONS = [".xlsx", ".xls"];
const CSV_EXTENSIONS = [".csv", ".txt"];

/** Strip CSV formula injection prefixes */
function sanitizeCell(value: unknown): string {
  const v = String(value ?? "")
    .trim()
    .replace(/^"|"$/g, "");
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

function normalizeHeaderKey(key: string) {
  return key.trim().toLowerCase().replace(/\s+/g, "");
}

function mapRecord(row: Record<string, unknown>): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    mapped[normalizeHeaderKey(key)] = sanitizeCell(value);
  }
  return mapped;
}

function phoneFromRow(row: Record<string, string>) {
  return (
    row.phone ??
    row.msisdn ??
    row.mobile ??
    row.mobilenumber ??
    row.number ??
    row.phonenumber ??
    Object.values(row)[0] ??
    ""
  );
}

function nameFromRow(row: Record<string, string>) {
  return row.name ?? row.fullname ?? row.full_name ?? "";
}

function countryFromRow(row: Record<string, string>) {
  return row.country ?? row.countrycode ?? row.country_code ?? "";
}

function tagsFromRow(row: Record<string, string>) {
  return row.tags ?? row.tag ?? "";
}

export function parseContactRecords(records: Record<string, string>[]): ContactImportPreview {
  const rows: ImportPreviewRow[] = [];
  const valid: CsvContactRow[] = [];
  const invalid: ContactImportPreview["invalid"] = [];
  const seen = new Set<string>();
  let duplicates = 0;

  records.forEach((rawRow, idx) => {
    const row = mapRecord(rawRow);
    const rowIndex = idx + 1;
    const phoneRaw = phoneFromRow(row);

    if (!phoneRaw) {
      const preview: ImportPreviewRow = {
        rowIndex,
        status: "invalid",
        reason: "Missing phone",
        phone: "",
        phoneRaw: "",
        name: sanitizeCell(nameFromRow(row)) || undefined,
        email: sanitizeCell(row.email ?? "") || undefined,
        tags: sanitizeCell(tagsFromRow(row)) || undefined,
      };
      rows.push(preview);
      invalid.push({ row: rowIndex, phone: "", reason: "Missing phone" });
      return;
    }

    const phone = normalizePhone(phoneRaw);
    if (!phone) {
      const preview: ImportPreviewRow = {
        rowIndex,
        status: "invalid",
        reason: "Invalid number",
        phone: phoneRaw,
        phoneRaw,
        name: sanitizeCell(nameFromRow(row)) || undefined,
        email: sanitizeCell(row.email ?? "") || undefined,
        tags: sanitizeCell(tagsFromRow(row)) || undefined,
      };
      rows.push(preview);
      invalid.push({ row: rowIndex, phone: phoneRaw, reason: "Invalid number" });
      return;
    }

    if (seen.has(phone)) {
      duplicates++;
      rows.push({
        rowIndex,
        status: "invalid",
        reason: "Duplicate in file",
        phone,
        phoneRaw,
        name: sanitizeCell(nameFromRow(row)) || undefined,
        email: sanitizeCell(row.email ?? "") || undefined,
        tags: sanitizeCell(tagsFromRow(row)) || undefined,
      });
      invalid.push({ row: rowIndex, phone, reason: "Duplicate in file" });
      return;
    }
    seen.add(phone);

    const countryRaw = countryFromRow(row);
    const contact: CsvContactRow = {
      name: sanitizeCell(nameFromRow(row)) || undefined,
      phone,
      email: sanitizeCell(row.email ?? "") || undefined,
      countryCode: countryRaw
        ? sanitizeCell(countryRaw).toUpperCase().slice(0, 2)
        : detectCountryCode(phone),
      tags: sanitizeCell(tagsFromRow(row)) || undefined,
    };

    valid.push(contact);
    rows.push({
      rowIndex,
      status: "valid",
      ...contact,
      phoneRaw,
    });
  });

  return {
    rows,
    valid,
    invalid,
    duplicates,
    totalRows: records.length,
  };
}

function fallbackNoHeader(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  return lines.map((line) => {
    const cols = line.split(",").map((c) => sanitizeCell(c));
    return {
      phone: cols[0] ?? "",
      name: cols[1] ?? "",
      tags: cols[2] ?? "",
    };
  });
}

export function parseContactsCsv(text: string): ContactImportPreview {
  const parsed = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => normalizeHeaderKey(h),
  });

  const records =
    parsed.data.length > 0 && Object.keys(parsed.data[0] ?? {}).length > 0
      ? parsed.data
      : fallbackNoHeader(text);

  return parseContactRecords(records);
}

export function parseContactsExcel(buffer: ArrayBuffer): ContactImportPreview {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { rows: [], valid: [], invalid: [], duplicates: 0, totalRows: 0 };
  }

  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  const records = json.map((row) => {
    const mapped: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      mapped[normalizeHeaderKey(String(key))] = sanitizeCell(value);
    }
    return mapped;
  });

  return parseContactRecords(records);
}

export function parseContactsUpload(filename: string, bytes: ArrayBuffer): ContactImportPreview {
  const lower = filename.toLowerCase();
  if (EXCEL_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
    return parseContactsExcel(bytes);
  }
  if (CSV_EXTENSIONS.some((ext) => lower.endsWith(ext)) || !lower.includes(".")) {
    const text = new TextDecoder("utf-8").decode(bytes);
    return parseContactsCsv(text);
  }

  throw new Error("Unsupported file type. Upload a CSV or Excel (.xlsx, .xls) file.");
}

export function countryBreakdownFromPreview(preview: ContactImportPreview) {
  const countries: Record<string, number> = {};
  for (const row of preview.valid) {
    const cc = row.countryCode ?? "UNK";
    countries[cc] = (countries[cc] ?? 0) + 1;
  }
  return countries;
}
