import { getSheetValues } from "@/lib/google/sheets";

type SpreadsheetMeta = {
  properties?: { title?: string };
  sheets?: Array<{ properties?: { title?: string } }>;
};

export type FormResponseSheet = {
  title: string;
  tab: string;
  headers: string[];
  rows: string[][];
};

export async function readFormResponseSheet(
  accessToken: string,
  spreadsheetId: string,
): Promise<FormResponseSheet> {
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=properties.title,sheets.properties.title`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (metaRes.status === 403 || metaRes.status === 404) {
    throw new Error("share_required");
  }
  if (!metaRes.ok) throw new Error(`sheets_meta_${metaRes.status}`);
  const meta = (await metaRes.json()) as SpreadsheetMeta;
  const titles = (meta.sheets ?? [])
    .map((s) => String(s.properties?.title ?? "").trim())
    .filter(Boolean);
  const tab = titles.find((t) => /form responses/i.test(t)) ?? titles[0] ?? "Sheet1";
  const quoted = `'${tab.replace(/'/g, "''")}'`;
  let values: string[][];
  try {
    values = await getSheetValues(accessToken, spreadsheetId, `${quoted}!A:ZZ`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("403") || message.includes("404")) {
      throw new Error("share_required");
    }
    throw error;
  }
  const headers = (values[0] ?? []).map((h) => String(h ?? "").trim());
  const rows = values.slice(1);
  return {
    title: String(meta.properties?.title ?? tab),
    tab,
    headers,
    rows,
  };
}

export function sheetRowToAnswers(headers: string[], row: string[]) {
  const answers: Record<string, string> = {};
  headers.forEach((header, i) => {
    if (!header) return;
    answers[header] = String(row[i] ?? "").trim();
  });
  return answers;
}
