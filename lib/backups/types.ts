export const BACKUP_CATEGORY_IDS = [
  "MEMBERS",
  "SETTINGS",
  "SENDER_IDS",
  "EMAILS",
  "MESSAGES",
  "NUMBERS",
] as const;

export type BackupCategoryId = (typeof BACKUP_CATEGORY_IDS)[number];

export const BACKUP_CATEGORY_LABEL: Record<BackupCategoryId, string> = {
  MEMBERS: "Members",
  SETTINGS: "Settings",
  SENDER_IDS: "Sender IDs",
  EMAILS: "Emails",
  MESSAGES: "SMS Messages",
  NUMBERS: "Numbers",
};

export type BackupFilters = {
  messageStatuses?: string[];
  dateFrom?: string;
  dateTo?: string;
};

export type CategoryProgress = {
  done: boolean;
  exported: number;
  total: number;
  cursor: string | null;
  chunkIndex: number;
};

export type BackupProgress = Partial<Record<BackupCategoryId, CategoryProgress>>;

export const BATCH_SIZE = 500;

/** Largest zip we'll attach directly to an email; above this we send the download link only. */
export const MAX_BACKUP_EMAIL_ATTACHMENT_BYTES = 10 * 1024 * 1024;
