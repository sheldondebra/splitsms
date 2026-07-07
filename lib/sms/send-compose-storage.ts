export type SendComposeSnapshot = {
  recipients: string;
  body: string;
  senderId: string;
  countryCode: string;
  selectedTemplateId: string;
  scheduledAt: string;
  draftCampaignId: string;
  savedAt: string;
};

const STORAGE_PREFIX = "splitsms:send-compose:";

export function sendComposeStorageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

export function hasSendComposeContent(snapshot: Partial<SendComposeSnapshot>) {
  return Boolean(
    snapshot.recipients?.trim() ||
      snapshot.body?.trim() ||
      snapshot.scheduledAt?.trim(),
  );
}

export function loadSendCompose(userId: string): SendComposeSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(sendComposeStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SendComposeSnapshot;
    if (!hasSendComposeContent(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function persistSendCompose(userId: string, snapshot: SendComposeSnapshot) {
  if (typeof window === "undefined") return;
  if (!hasSendComposeContent(snapshot)) {
    clearSendCompose(userId);
    return;
  }
  try {
    window.localStorage.setItem(
      sendComposeStorageKey(userId),
      JSON.stringify({ ...snapshot, savedAt: new Date().toISOString() }),
    );
  } catch {
    // Ignore quota / private mode errors
  }
}

export function clearSendCompose(userId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(sendComposeStorageKey(userId));
  } catch {
    // Ignore
  }
}
