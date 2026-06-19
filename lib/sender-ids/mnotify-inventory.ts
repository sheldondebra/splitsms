import { prisma } from "@/lib/db";
import { loadMnotifySettings } from "@/lib/mnotify-settings";
import {
  fetchMnotifySenderIdListFromApi,
  type MnotifySenderIdRecord,
} from "@/lib/mnotify/sender-id-api";
import { checkMnotifySenderIdStatus } from "@/lib/mnotify";
import { mapProviderStatusText, isMnotifyHoldStatus } from "@/lib/sender-ids/provider-registrations";
import type { SenderIdProviderStatus, SenderIdStatus } from "@/lib/generated/prisma/client";

export const MNOTIFY_SENDER_TRACKER_KEY = "mnotify_sender_tracker";

export type MnotifySenderTrackerEntry = {
  purpose: string | null;
  addedAt: string;
  note?: string;
};

export type MnotifySenderTracker = {
  entries: Record<string, MnotifySenderTrackerEntry>;
  updatedAt?: string;
};

export type MnotifySenderInventoryRow = {
  senderName: string;
  purpose: string | null;
  mnotifyStatus: string | null;
  mnotifyMapped: SenderIdProviderStatus | "UNKNOWN";
  isOnHold: boolean;
  existsOnMnotify: boolean;
  statusMismatch: boolean;
  mismatchDetail: string | null;
  platform: {
    id: string;
    userId: string;
    memberName: string;
    memberPhone: string;
    platformStatus: SenderIdStatus;
    mnotifyRegStatus: SenderIdProviderStatus | null;
  } | null;
  error?: string;
};

export async function loadMnotifySenderTracker(): Promise<MnotifySenderTracker> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: MNOTIFY_SENDER_TRACKER_KEY },
  });
  const value = row?.value as Partial<MnotifySenderTracker> | null;
  return {
    entries: value?.entries ?? {},
    updatedAt: value?.updatedAt,
  };
}

export async function saveMnotifySenderTracker(
  tracker: MnotifySenderTracker,
  actorId?: string,
) {
  const next: MnotifySenderTracker = {
    ...tracker,
    updatedAt: new Date().toISOString(),
  };

  await prisma.platformSetting.upsert({
    where: { key: MNOTIFY_SENDER_TRACKER_KEY },
    update: { value: next },
    create: { key: MNOTIFY_SENDER_TRACKER_KEY, value: next },
  });

  if (actorId) {
    await prisma.auditLog.create({
      data: {
        actorId,
        action: "MNOTIFY_SENDER_TRACKER_UPDATED",
        entityType: "PlatformSetting",
        entityId: MNOTIFY_SENDER_TRACKER_KEY,
        metadata: { count: Object.keys(next.entries).length },
      },
    });
  }

  return next;
}

async function collectCandidateNames(): Promise<Set<string>> {
  const names = new Set<string>();
  const [settings, platformRows, tracker] = await Promise.all([
    loadMnotifySettings(),
    prisma.senderId.findMany({
      select: { value: true },
      distinct: ["value"],
    }),
    loadMnotifySenderTracker(),
  ]);

  if (settings.defaultSenderId.trim()) {
    names.add(settings.defaultSenderId.trim());
  }

  for (const row of platformRows) {
    if (row.value.trim()) names.add(row.value.trim());
  }

  for (const key of Object.keys(tracker.entries)) {
    if (key.trim()) names.add(key.trim());
  }

  return names;
}

async function mapPlatformSendersByValue() {
  const rows = await prisma.senderId.findMany({
    include: {
      user: { select: { id: true, fullName: true, phone: true } },
      providerRegistrations: { where: { provider: "MNOTIFY" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const map = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    const key = row.value.trim().toUpperCase();
    if (!map.has(key)) map.set(key, row);
  }
  return map;
}

async function statusCheckBatch(names: string[]) {
  const results = new Map<string, Awaited<ReturnType<typeof checkMnotifySenderIdStatus>>>();
  const concurrency = 6;

  for (let i = 0; i < names.length; i += concurrency) {
    const chunk = names.slice(i, i + concurrency);
    const settled = await Promise.all(
      chunk.map(async (name) => [name, await checkMnotifySenderIdStatus(name)] as const),
    );
    for (const [name, result] of settled) {
      results.set(name.toUpperCase(), result);
    }
  }

  return results;
}

function mergeApiListIntoMap(
  map: Map<string, MnotifySenderIdRecord>,
  items: MnotifySenderIdRecord[],
) {
  for (const item of items) {
    map.set(item.senderName.toUpperCase(), item);
  }
}

function detectInventoryMismatch(
  existsOnMnotify: boolean,
  mnotifyMapped: SenderIdProviderStatus | "UNKNOWN",
  isOnHold: boolean,
  platform: MnotifySenderInventoryRow["platform"],
): { statusMismatch: boolean; mismatchDetail: string | null } {
  if (!platform) return { statusMismatch: false, mismatchDetail: null };

  if (!existsOnMnotify && platform.platformStatus === "APPROVED") {
    return {
      statusMismatch: true,
      mismatchDetail: "Approved on SplitSMS but deleted or missing at mNotify.",
    };
  }

  if (mnotifyMapped === "REJECTED" && platform.platformStatus === "APPROVED") {
    return {
      statusMismatch: true,
      mismatchDetail: "SplitSMS shows approved but mNotify reports denied or deleted.",
    };
  }

  if (isOnHold && platform.platformStatus === "APPROVED") {
    return {
      statusMismatch: true,
      mismatchDetail: "mNotify has this sender on hold — SplitSMS should stay pending.",
    };
  }

  if (
    mnotifyMapped === "PENDING" &&
    platform.platformStatus === "APPROVED" &&
    platform.mnotifyRegStatus !== "APPROVED"
  ) {
    return {
      statusMismatch: true,
      mismatchDetail: "mNotify is still pending but SplitSMS is approved.",
    };
  }

  return { statusMismatch: false, mismatchDetail: null };
}

export async function buildMnotifySenderInventory(): Promise<{
  rows: MnotifySenderInventoryRow[];
  listSource: "api" | "discovered";
  listError?: string;
  checkedAt: string;
}> {
  const [apiList, candidateNames, platformMap, tracker] = await Promise.all([
    fetchMnotifySenderIdListFromApi(),
    collectCandidateNames(),
    mapPlatformSendersByValue(),
    loadMnotifySenderTracker(),
  ]);

  const apiByName = new Map<string, MnotifySenderIdRecord>();
  if (apiList.ok) {
    mergeApiListIntoMap(apiByName, apiList.items);
    for (const item of apiList.items) {
      candidateNames.add(item.senderName);
    }
  }

  const names = [...candidateNames].sort((a, b) => a.localeCompare(b));
  const statusByName = await statusCheckBatch(names);

  const rows: MnotifySenderInventoryRow[] = names.map((senderName) => {
    const key = senderName.toUpperCase();
    const apiRow = apiByName.get(key);
    const trackerEntry = tracker.entries[senderName] ?? tracker.entries[key];
    const platformRow = platformMap.get(key) ?? null;
    const statusResult = statusByName.get(key);

    let mnotifyStatus: string | null = null;
    let existsOnMnotify = false;
    let error: string | undefined;

    if (statusResult?.ok) {
      mnotifyStatus = statusResult.providerStatus ?? apiRow?.status ?? null;
      existsOnMnotify = true;
    } else if (statusResult && !statusResult.ok) {
      const err = (statusResult.error ?? "").toLowerCase();
      const statusText = (statusResult.providerStatus ?? "").toLowerCase();
      const notFound =
        err.includes("not found") ||
        err.includes("does not exist") ||
        err.includes("no sender") ||
        err.includes("invalid") ||
        statusText.includes("not found") ||
        statusText.includes("delete") ||
        statusText.includes("removed");

      if (notFound) {
        existsOnMnotify = false;
        mnotifyStatus = statusResult.providerStatus ?? "Deleted / not found at mNotify";
      } else {
        error = statusResult.error;
        mnotifyStatus = statusResult.providerStatus ?? apiRow?.status ?? null;
        existsOnMnotify = Boolean(apiRow) || Boolean(mnotifyStatus);
      }
    } else if (apiRow) {
      mnotifyStatus = apiRow.status;
      existsOnMnotify = true;
    }

    const isOnHold = isMnotifyHoldStatus(mnotifyStatus);
    const mapped = mnotifyStatus
      ? mapProviderStatusText(mnotifyStatus)
      : existsOnMnotify
        ? "PENDING"
        : "UNKNOWN";

    const { statusMismatch, mismatchDetail } = detectInventoryMismatch(
      existsOnMnotify,
      mapped === "PENDING" && !existsOnMnotify ? "UNKNOWN" : mapped,
      isOnHold,
      platformRow
        ? {
            id: platformRow.id,
            userId: platformRow.userId,
            memberName: platformRow.user.fullName,
            memberPhone: platformRow.user.phone,
            platformStatus: platformRow.status,
            mnotifyRegStatus: platformRow.providerRegistrations[0]?.status ?? null,
          }
        : null,
    );

    return {
      senderName,
      purpose: apiRow?.purpose ?? trackerEntry?.purpose ?? null,
      mnotifyStatus,
      mnotifyMapped: mapped === "PENDING" && !existsOnMnotify ? "UNKNOWN" : mapped,
      isOnHold,
      existsOnMnotify,
      statusMismatch,
      mismatchDetail,
      platform: platformRow
        ? {
            id: platformRow.id,
            userId: platformRow.userId,
            memberName: platformRow.user.fullName,
            memberPhone: platformRow.user.phone,
            platformStatus: platformRow.status,
            mnotifyRegStatus: platformRow.providerRegistrations[0]?.status ?? null,
          }
        : null,
      error,
    };
  });

  return {
    rows,
    listSource: apiList.ok ? apiList.source : "discovered",
    listError: apiList.ok ? undefined : apiList.error,
    checkedAt: new Date().toISOString(),
  };
}
