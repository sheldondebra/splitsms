import { normalizePhones } from "@/lib/sms/units";
import { detectCountryCode } from "@/lib/contacts/country-from-phone";
import type { CsvContactRow } from "@/lib/contacts/csv-import";

export type DriveSpreadsheetFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
};

type DriveListResponse = {
  files?: Array<{
    id?: string;
    name?: string;
    mimeType?: string;
    modifiedTime?: string;
  }>;
  nextPageToken?: string;
};

export async function listSpreadsheetFiles(
  accessToken: string,
  opts?: { pageSize?: number },
): Promise<DriveSpreadsheetFile[]> {
  const pageSize = opts?.pageSize ?? 50;
  const q = encodeURIComponent(
    "(mimeType='application/vnd.google-apps.spreadsheet' or mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType='application/vnd.ms-excel') and trashed=false",
  );
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&fields=files(id,name,mimeType,modifiedTime)&q=${q}&orderBy=modifiedTime desc`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );
  if (!res.ok) throw new Error(`drive_list_${res.status}`);
  const data = (await res.json()) as DriveListResponse;
  return (data.files ?? [])
    .filter((f) => f.id && f.name && f.mimeType)
    .map((f) => ({
      id: f.id!,
      name: f.name!,
      mimeType: f.mimeType!,
      modifiedTime: f.modifiedTime,
    }));
}

export async function getSheetValues(
  accessToken: string,
  spreadsheetId: string,
  range = "A1:Z1000",
): Promise<string[][]> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );
  if (!res.ok) throw new Error(`sheets_values_${res.status}`);
  const data = (await res.json()) as { values?: string[][] };
  return data.values ?? [];
}

export function inferPhoneColumn(header: string[]): number {
  const idx = header.findIndex((h) =>
    /phone|mobile|msisdn|tel/i.test(String(h ?? "")),
  );
  return idx >= 0 ? idx : 0;
}

export function inferNameColumn(header: string[]): number | null {
  const idx = header.findIndex((h) => /name|full.?name|contact/i.test(String(h ?? "")));
  return idx >= 0 ? idx : null;
}

export function rowsToContacts(
  values: string[][],
  opts: { phoneCol: number; nameCol?: number | null; hasHeader?: boolean },
): CsvContactRow[] {
  if (values.length === 0) return [];
  const start = opts.hasHeader === false ? 0 : 1;
  const out: CsvContactRow[] = [];
  const seen = new Set<string>();

  for (let i = start; i < values.length; i++) {
    const row = values[i] ?? [];
    const rawPhone = String(row[opts.phoneCol] ?? "");
    const phone = normalizePhones(rawPhone)[0];
    if (!phone || seen.has(phone)) continue;
    seen.add(phone);
    const name =
      opts.nameCol != null ? String(row[opts.nameCol] ?? "").trim() || undefined : undefined;
    out.push({
      phone,
      name,
      countryCode: detectCountryCode(phone),
    });
  }
  return out;
}

export async function createSpreadsheetWithRows(
  accessToken: string,
  opts: { title: string; headers: string[]; rows: string[][] },
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: { title: opts.title },
    }),
  });
  if (!createRes.ok) throw new Error(`sheets_create_${createRes.status}`);
  const created = (await createRes.json()) as {
    spreadsheetId?: string;
    spreadsheetUrl?: string;
  };
  if (!created.spreadsheetId) throw new Error("sheets_create_missing_id");

  const values = [opts.headers, ...opts.rows];
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${created.spreadsheetId}/values/A1:append?valueInputOption=RAW`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values }),
    },
  );
  if (!updateRes.ok) throw new Error(`sheets_append_${updateRes.status}`);

  return {
    spreadsheetId: created.spreadsheetId,
    spreadsheetUrl:
      created.spreadsheetUrl ??
      `https://docs.google.com/spreadsheets/d/${created.spreadsheetId}`,
  };
}
