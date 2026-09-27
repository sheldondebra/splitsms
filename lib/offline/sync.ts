"use client";

import { sendSmsAction, saveSendDraftAction } from "@/lib/actions/sms";
import { createContactSyncAction } from "@/lib/actions/contacts";
import {
  listOfflineQueue,
  payloadToFormData,
  removeOfflineQueueItem,
  updateOfflineQueueItem,
  type OfflineQueueItem,
} from "@/lib/offline/queue";
import { isBrowserOnline } from "@/lib/offline/network";

export type OfflineSyncResult = {
  synced: number;
  failed: number;
  remaining: number;
  errors: string[];
};

async function flushItem(item: OfflineQueueItem): Promise<{ ok: true } | { ok: false; error: string }> {
  const formData = payloadToFormData(item.payload);

  if (item.kind === "send_sms") {
    const result = await sendSmsAction(formData);
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true };
  }

  if (item.kind === "save_draft") {
    const result = await saveSendDraftAction(formData);
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true };
  }

  if (item.kind === "create_contact") {
    const result = await createContactSyncAction(formData);
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true };
  }

  return { ok: false, error: `Unknown offline action: ${item.kind}` };
}

let flushing = false;

/** Replay queued actions once the network is back. */
export async function flushOfflineQueue(): Promise<OfflineSyncResult> {
  if (flushing) {
    return { synced: 0, failed: 0, remaining: await listOfflineQueue().then((q) => q.length), errors: [] };
  }
  if (!isBrowserOnline()) {
    const remaining = await listOfflineQueue();
    return { synced: 0, failed: 0, remaining: remaining.length, errors: ["Still offline"] };
  }

  flushing = true;
  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    const items = await listOfflineQueue();
    for (const item of items) {
      if (!isBrowserOnline()) break;
      try {
        const result = await flushItem(item);
        if (result.ok) {
          await removeOfflineQueueItem(item.id);
          synced += 1;
        } else {
          failed += 1;
          errors.push(`${item.label}: ${result.error}`);
          await updateOfflineQueueItem(item.id, {
            attempts: item.attempts + 1,
            lastError: result.error,
          });
        }
      } catch (error) {
        failed += 1;
        const message = error instanceof Error ? error.message : "Sync failed";
        errors.push(`${item.label}: ${message}`);
        await updateOfflineQueueItem(item.id, {
          attempts: item.attempts + 1,
          lastError: message,
        });
      }
    }
  } finally {
    flushing = false;
  }

  const remaining = await listOfflineQueue();
  return { synced, failed, remaining: remaining.length, errors };
}
