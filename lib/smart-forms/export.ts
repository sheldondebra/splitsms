type ExportAnswer = {
  fieldKey: string;
  fieldLabel: string;
  value: string;
};

export type ExportResponseRow = {
  id: string;
  submittedAt: string;
  source: string | null;
  contactSaveStatus: string;
  smsStatus: string;
  reviewedAt: string | null;
  answers: ExportAnswer[];
};

export function buildResponsesCsv(
  formName: string,
  fieldLabels: { key: string; label: string }[],
  rows: ExportResponseRow[],
): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const metaHeaders = [
    "submitted_at",
    "source",
    "contact_status",
    "sms_status",
    "reviewed",
  ];
  const fieldHeaders = fieldLabels.map((f) => f.key);
  const header = [...metaHeaders, ...fieldHeaders].join(",");

  const body = rows
    .map((row) => {
      const answerMap = new Map(row.answers.map((a) => [a.fieldKey, a.value]));
      const meta = [
        esc(new Date(row.submittedAt).toISOString()),
        esc(row.source ?? ""),
        esc(row.contactSaveStatus),
        esc(row.smsStatus),
        esc(row.reviewedAt ? "yes" : "no"),
      ];
      const fields = fieldHeaders.map((key) => esc(answerMap.get(key) ?? ""));
      return [...meta, ...fields].join(",");
    })
    .join("\n");

  return `# ${formName}\n${header}\n${body}`;
}

export function extractDisplayFields(answers: ExportAnswer[]) {
  const map = new Map(answers.map((a) => [a.fieldKey, a.value]));
  const name =
    map.get("full_name") ??
    map.get("name") ??
    map.get("guardian_name") ??
    [...map.entries()].find(([k]) => k.includes("name"))?.[1] ??
    "";
  const phone =
    map.get("phone") ?? [...map.values()].find((v) => v.startsWith("+") || /^\+?\d{10,}$/.test(v)) ?? "";
  const email = map.get("email") ?? "";
  return { name, phone, email };
}
