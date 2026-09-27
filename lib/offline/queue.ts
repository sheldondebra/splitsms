export type OfflineQueueKind = "send_sms" | "save_draft" | "create_contact";

export type OfflineQueueItem = {
  id: string;
  kind: OfflineQueueKind;
  /** Flat string payload suitable for rebuilding FormData */
  payload: Record<string, string>;
  label: string;
  createdAt: string;
  attempts: number;
  lastError: string | null;
};

const DB_NAME = "splitsms-offline";
const DB_VERSION = 1;
const STORE = "queue";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB request failed"));
  });
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formDataToPayload(formData: FormData): Record<string, string> {
  const payload: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") payload[key] = value;
  }
  return payload;
}

export function payloadToFormData(payload: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    formData.set(key, value);
  }
  return formData;
}

export async function enqueueOfflineAction(input: {
  kind: OfflineQueueKind;
  payload: Record<string, string>;
  label: string;
}): Promise<OfflineQueueItem> {
  const item: OfflineQueueItem = {
    id: newId(),
    kind: input.kind,
    payload: input.payload,
    label: input.label,
    createdAt: new Date().toISOString(),
    attempts: 0,
    lastError: null,
  };

  const db = await openDb();
  try {
    await reqToPromise(db.transaction(STORE, "readwrite").objectStore(STORE).put(item));
  } finally {
    db.close();
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("splitsms:offline-queue-changed"));
  }

  return item;
}

export async function listOfflineQueue(): Promise<OfflineQueueItem[]> {
  const db = await openDb();
  try {
    const rows = await reqToPromise(
      db.transaction(STORE, "readonly").objectStore(STORE).getAll(),
    );
    return (rows as OfflineQueueItem[]).sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    );
  } finally {
    db.close();
  }
}

export async function countOfflineQueue(): Promise<number> {
  const db = await openDb();
  try {
    return await reqToPromise(
      db.transaction(STORE, "readonly").objectStore(STORE).count(),
    );
  } finally {
    db.close();
  }
}

export async function removeOfflineQueueItem(id: string): Promise<void> {
  const db = await openDb();
  try {
    await reqToPromise(db.transaction(STORE, "readwrite").objectStore(STORE).delete(id));
  } finally {
    db.close();
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("splitsms:offline-queue-changed"));
  }
}

export async function updateOfflineQueueItem(
  id: string,
  patch: Partial<Pick<OfflineQueueItem, "attempts" | "lastError">>,
): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const existing = (await reqToPromise(store.get(id))) as OfflineQueueItem | undefined;
    if (!existing) return;
    await reqToPromise(store.put({ ...existing, ...patch }));
  } finally {
    db.close();
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("splitsms:offline-queue-changed"));
  }
}
