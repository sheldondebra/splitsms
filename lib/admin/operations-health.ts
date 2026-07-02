import IORedis from "ioredis";
import { Queue } from "bullmq";
import { prisma } from "@/lib/db";
import { SMS_SEND_QUEUE } from "@/lib/queue/sms-queue";
import { isMailjetConfigured } from "@/lib/email/config";
import { getMnotifyStatus } from "@/lib/mnotify";
import { getPaymentGatewaysOverview } from "@/lib/payments/gateway-settings";
import { smsWorkersEnabled } from "@/lib/queue/sms-workers-enabled";
import type { MessageStatus } from "@/lib/generated/prisma/client";

const QUEUED_MESSAGE_STATUSES: MessageStatus[] = ["PENDING", "PROCESSING"];

export type OperationsHealth = {
  database: { ok: boolean; latencyMs: number | null };
  redis: {
    configured: boolean;
    ok: boolean;
    mode: "queue" | "inline";
    workersEnabled: boolean;
  };
  queue: {
    waiting: number;
    active: number;
    delayed: number;
    failed: number;
  } | null;
  pendingMessages: number;
  stuckMessages: number;
  mailjet: boolean;
  smsGateway: boolean;
  activePaymentGateways: number;
  overall: "healthy" | "degraded" | "critical";
};

const REDIS_PROBE_MS = 2500;

async function probeRedis(): Promise<{
  ok: boolean;
  queue: OperationsHealth["queue"];
}> {
  const url = process.env.REDIS_URL;
  if (!url) return { ok: false, queue: null };

  let redis: IORedis | null = null;
  let queue: Queue | null = null;

  try {
    redis = new IORedis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: REDIS_PROBE_MS,
      commandTimeout: REDIS_PROBE_MS,
      lazyConnect: true,
      retryStrategy: () => null,
      enableOfflineQueue: false,
    });

    await Promise.race([
      redis.connect().then(() => redis!.ping()),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("redis timeout")), REDIS_PROBE_MS),
      ),
    ]);

    queue = new Queue(SMS_SEND_QUEUE, {
      connection: redis,
    });

    const counts = await Promise.race([
      queue.getJobCounts("waiting", "active", "delayed", "failed"),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("queue timeout")), REDIS_PROBE_MS),
      ),
    ]);

    return {
      ok: true,
      queue: {
        waiting: counts.waiting ?? 0,
        active: counts.active ?? 0,
        delayed: counts.delayed ?? 0,
        failed: counts.failed ?? 0,
      },
    };
  } catch {
    return { ok: false, queue: null };
  } finally {
    await queue?.close().catch(() => undefined);
    await redis?.quit().catch(() => undefined);
  }
}

export async function getOperationsHealth(): Promise<OperationsHealth> {
  const redisConfigured = Boolean(process.env.REDIS_URL);
  const workersEnabled = smsWorkersEnabled();
  const stuckThreshold = new Date(Date.now() - 30 * 60 * 1000);

  const [pendingMessages, stuckMessages, mnotify, gateways, redisProbe] = await Promise.all([
    prisma.message.count({ where: { status: { in: QUEUED_MESSAGE_STATUSES } } }),
    prisma.message.count({
      where: { status: { in: QUEUED_MESSAGE_STATUSES }, createdAt: { lt: stuckThreshold } },
    }),
    getMnotifyStatus(),
    getPaymentGatewaysOverview(),
    redisConfigured ? probeRedis() : Promise.resolve({ ok: false, queue: null }),
  ]);

  let databaseOk = false;
  let dbLatency: number | null = null;
  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - t0;
    databaseOk = true;
  } catch {
    databaseOk = false;
  }

  const mailjet = isMailjetConfigured();
  const smsGateway = mnotify.configured;
  const activePaymentGateways = gateways.filter((g) => g.configured && g.enabled).length;
  const redisOk = redisProbe.ok;
  const queueCounts = redisProbe.queue;

  let overall: OperationsHealth["overall"] = "healthy";
  if (!databaseOk || !smsGateway) overall = "critical";
  else if (
    stuckMessages > 0 ||
    (queueCounts?.failed ?? 0) > 10 ||
    (redisConfigured && workersEnabled && !redisOk) ||
    pendingMessages > 50
  ) {
    overall = "degraded";
  }

  return {
    database: { ok: databaseOk, latencyMs: dbLatency },
    redis: {
      configured: redisConfigured,
      ok: redisOk,
      mode: workersEnabled && redisOk ? "queue" : "inline",
      workersEnabled,
    },
    queue: queueCounts,
    pendingMessages,
    stuckMessages,
    mailjet,
    smsGateway,
    activePaymentGateways,
    overall,
  };
}

/** User-facing copy for admin SMS delivery status cards. */
export function describeSmsDeliveryMode(health: OperationsHealth): {
  modeLabel: string;
  statusLabel: string;
  detail: string;
  tone: "ok" | "warning" | "muted";
} {
  if (health.redis.workersEnabled) {
    if (health.redis.ok) {
      const waiting = health.queue?.waiting ?? 0;
      return {
        modeLabel: "Worker queue",
        statusLabel: "Redis connected",
        detail:
          waiting > 0
            ? `${waiting} job${waiting === 1 ? "" : "s"} waiting — npm run worker:sms is processing the queue.`
            : "Worker queue is connected and idle.",
        tone: "ok",
      };
    }

    return {
      modeLabel: "Worker queue",
      statusLabel: "Redis offline",
      detail:
        "Start Redis and npm run worker:sms, or unset SMS_WORKERS_ENABLED to send inline from the app.",
      tone: "warning",
    };
  }

  if (health.stuckMessages > 0) {
    return {
      modeLabel: "Inline delivery",
      statusLabel: `${health.stuckMessages} stuck`,
      detail:
        "Some messages pending over 30 minutes. Call /api/cron/process-sms on a schedule with CRON_SECRET.",
      tone: "warning",
    };
  }

  if (health.pendingMessages > 0) {
    return {
      modeLabel: "Inline delivery",
      statusLabel: `${health.pendingMessages} pending`,
      detail: "Messages send from the app. The process-sms cron drains any backlog automatically.",
      tone: "muted",
    };
  }

  return {
    modeLabel: "Inline delivery",
    statusLabel: "Ready",
    detail: "SMS sends through mNotify when users submit — no Redis worker required.",
    tone: "ok",
  };
}
