const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MAX_NOTICE_EMAILS = 3;

export function isReportEmail(value: string) {
  return EMAIL_RE.test(value) && value.length <= 160;
}

export function parseNoticeEmails(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  const seen = new Set<string>();
  const emails: string[] = [];
  for (const part of value.split(/[,;\s]+/)) {
    const email = part.trim().toLowerCase();
    if (!isReportEmail(email) || seen.has(email)) continue;
    seen.add(email);
    emails.push(email);
    if (emails.length >= MAX_NOTICE_EMAILS) break;
  }
  return emails;
}

export function serializeNoticeEmails(emails: string[]): string {
  return parseNoticeEmails(emails.join(", ")).join(", ");
}
