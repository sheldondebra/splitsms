import { prisma } from "@/lib/db";
import { notifySlackStuckSms } from "@/lib/slack/notify";

const ALERT_STATE_KEY = "slack_stuck_sms_alert_state";
/** Alert when messages sit queued at least this long (matches typical support reports). */
export const SMS_SLACK_ALERT_MIN_AGE_MS = 5 * 60 * 1000;
/** Avoid spamming the channel while cron runs every minute. */
const SMS_SLACK_ALERT_DEDUP_MS = 15 * 60 * 1000;

type AlertState = {
  lastAlertAt: string;
  stuckCount: number;
};

async function loadAlertState(): Promise<AlertState | null> {
  const row = await prisma.platformSetting.findUnique({ where: { key: ALERT_STATE_KEY } });
  if (!row?.value || typeof row.value !== "object") return null;
  const v = row.value as Partial<AlertState>;
  if (typeof v.lastAlertAt !== "string") return null;
  return { lastAlertAt: v.lastAlertAt, stuckCount: Number(v.stuckCount ?? 0) };
}

async function saveAlertState(state: AlertState) {
  await prisma.platformSetting.upsert({
    where: { key: ALERT_STATE_KEY },
    update: { value: state },
    create: { key: ALERT_STATE_KEY, value: state },
  });
}

async function clearAlertState() {
  await prisma.platformSetting.deleteMany({ where: { key: ALERT_STATE_KEY } });
}

export async function countDelayedSms(minAgeMs = SMS_SLACK_ALERT_MIN_AGE_MS) {
  const cutoff = new Date(Date.now() - minAgeMs);
  return prisma.message.count({
    where: {
      status: { in: ["PENDING", "PROCESSING"] },
      isSandbox: false,
      createdAt: { lt: cutoff },
    },
  });
}

/** Post to Slack when SMS sits in the queue too long. Called from cron + safe to retry. */
export async function maybeNotifySlackStuckSms() {
  const delayedCount = await countDelayedSms();

  if (delayedCount === 0) {
    await clearAlertState();
    return { notified: false as const, delayedCount: 0 };
  }

  const state = await loadAlertState();
  const now = Date.now();
  if (state) {
    const elapsed = now - new Date(state.lastAlertAt).getTime();
    const countWorsened = delayedCount > state.stuckCount;
    if (elapsed < SMS_SLACK_ALERT_DEDUP_MS && !countWorsened) {
      return { notified: false as const, delayedCount, deduped: true };
    }
  }

  const oldest = await prisma.message.findFirst({
    where: {
      status: { in: ["PENDING", "PROCESSING"] },
      isSandbox: false,
      createdAt: { lt: new Date(Date.now() - SMS_SLACK_ALERT_MIN_AGE_MS) },
    },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  const pendingTotal = await prisma.message.count({
    where: { status: { in: ["PENDING", "PROCESSING"] }, isSandbox: false },
  });

  const oldestAgeMinutes = oldest
    ? Math.max(1, Math.round((now - oldest.createdAt.getTime()) / 60_000))
    : SMS_SLACK_ALERT_MIN_AGE_MS / 60_000;

  await notifySlackStuckSms({
    delayedCount,
    pendingTotal,
    oldestAgeMinutes,
  });

  await saveAlertState({ lastAlertAt: new Date().toISOString(), stuckCount: delayedCount });

  return { notified: true as const, delayedCount };
}
