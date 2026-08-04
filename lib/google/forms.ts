import { normalizePhones } from "@/lib/sms/units";

export type GoogleFormSummary = {
  id: string;
  name: string;
  modifiedTime?: string;
};

type DriveListResponse = {
  files?: Array<{ id?: string; name?: string; modifiedTime?: string }>;
};

export type GoogleFormQuestion = {
  questionId: string;
  title: string;
};

export type GoogleFormResponseRow = {
  responseId: string;
  createTime: string;
  answers: Record<string, string>;
};

export async function listGoogleForms(
  accessToken: string,
  opts?: { pageSize?: number },
): Promise<GoogleFormSummary[]> {
  const pageSize = opts?.pageSize ?? 50;
  const q = encodeURIComponent(
    "mimeType='application/vnd.google-apps.form' and trashed=false",
  );
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&fields=files(id,name,modifiedTime)&q=${q}&orderBy=modifiedTime desc`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );
  if (!res.ok) throw new Error(`forms_drive_list_${res.status}`);
  const data = (await res.json()) as DriveListResponse;
  return (data.files ?? [])
    .filter((f) => f.id && f.name)
    .map((f) => ({ id: f.id!, name: f.name!, modifiedTime: f.modifiedTime }));
}

type FormsGetResponse = {
  items?: Array<{
    title?: string;
    questionItem?: {
      question?: {
        questionId?: string;
        textQuestion?: unknown;
        choiceQuestion?: unknown;
      };
    };
  }>;
  info?: { title?: string };
};

export async function getGoogleFormQuestions(
  accessToken: string,
  formId: string,
): Promise<{ title: string; questions: GoogleFormQuestion[] }> {
  const res = await fetch(
    `https://forms.googleapis.com/v1/forms/${encodeURIComponent(formId)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );
  if (!res.ok) throw new Error(`forms_get_${res.status}`);
  const data = (await res.json()) as FormsGetResponse;
  const questions: GoogleFormQuestion[] = [];
  for (const item of data.items ?? []) {
    const q = item.questionItem?.question;
    const questionId = String(q?.questionId ?? "").trim();
    const title = String(item.title ?? "").trim();
    if (!questionId || !title) continue;
    questions.push({ questionId, title });
  }
  return {
    title: String(data.info?.title ?? "Google Form"),
    questions,
  };
}

type FormsResponsesList = {
  responses?: Array<{
    responseId?: string;
    createTime?: string;
    answers?: Record<
      string,
      {
        textAnswers?: { answers?: Array<{ value?: string }> };
      }
    >;
  }>;
  nextPageToken?: string;
};

export async function listGoogleFormResponses(
  accessToken: string,
  formId: string,
  opts?: { pageSize?: number; filter?: string },
): Promise<GoogleFormResponseRow[]> {
  const params = new URLSearchParams({
    pageSize: String(opts?.pageSize ?? 100),
  });
  if (opts?.filter) params.set("filter", opts.filter);

  const res = await fetch(
    `https://forms.googleapis.com/v1/forms/${encodeURIComponent(formId)}/responses?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );
  if (!res.ok) throw new Error(`forms_responses_${res.status}`);
  const data = (await res.json()) as FormsResponsesList;
  const out: GoogleFormResponseRow[] = [];
  for (const row of data.responses ?? []) {
    const responseId = String(row.responseId ?? "").trim();
    if (!responseId) continue;
    const answers: Record<string, string> = {};
    for (const [qid, ans] of Object.entries(row.answers ?? {})) {
      const value = String(ans.textAnswers?.answers?.[0]?.value ?? "").trim();
      if (value) answers[qid] = value;
    }
    out.push({
      responseId,
      createTime: String(row.createTime ?? new Date().toISOString()),
      answers,
    });
  }
  return out;
}

export function renderTemplate(
  template: string,
  answers: Record<string, string>,
  questionTitles: Record<string, string>,
): string {
  let out = template;
  for (const [qid, value] of Object.entries(answers)) {
    const title = questionTitles[qid] ?? qid;
    out = out.replaceAll(`{{${qid}}}`, value);
    out = out.replaceAll(`{{${title}}}`, value);
  }
  return out;
}

export function pickPhoneFromAnswers(
  answers: Record<string, string>,
  phoneFieldId: string,
): string | null {
  const raw = answers[phoneFieldId];
  if (!raw) return null;
  return normalizePhones(raw)[0] ?? null;
}
