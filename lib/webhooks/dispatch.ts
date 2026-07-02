import { createHmac } from "crypto";
import { prisma } from "@/lib/db";
import { MessageStatus } from "@/lib/generated/prisma/client";

const EVENT_MAP: Record<MessageStatus, string> = {
  DELIVERED: "message.delivered",
  FAILED: "message.failed",
  SENT: "message.sent",
  PENDING: "message.pending",
  PROCESSING: "message.pending",
  REJECTED: "message.failed",
  EXPIRED: "message.failed",
};

const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000];

type WebhookMessage = {
  id: string;
  recipient: string;
  status: MessageStatus;
  providerType?: string | null;
  campaignId?: string | null;
};

export async function dispatchUserWebhooks(
  userId: string,
  message: WebhookMessage,
  eventOverride?: string,
  extra?: Record<string, unknown>,
) {
  const event = eventOverride ?? EVENT_MAP[message.status];
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: { userId, isActive: true },
  });

  const payload = {
    event,
    timestamp: new Date().toISOString(),
    data: { ...message, ...extra },
  };

  for (const ep of endpoints) {
    if (!ep.events.includes(event)) continue;
    await deliverWebhook(ep.id, ep.url, ep.secret, event, payload, 0);
  }
}

async function deliverWebhook(
  endpointId: string,
  url: string,
  secret: string | null,
  event: string,
  payload: object,
  retryCount: number,
): Promise<boolean> {
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-SplitSMS-Event": event,
  };
  if (secret) {
    const sig = createHmac("sha256", secret).update(body).digest("hex");
    headers["X-SplitSMS-Signature"] = sig;
  }

  let statusCode: number | null = null;
  let success = false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(10_000),
    });
    statusCode = res.status;
    success = res.ok;
  } catch {
    success = false;
  }

  const nextDelay = RETRY_DELAYS_MS[retryCount];
  await prisma.webhookDeliveryLog.create({
    data: {
      endpointId,
      event,
      payload,
      statusCode: statusCode ?? undefined,
      success,
      retryCount,
      nextRetryAt:
        !success && nextDelay != null
          ? new Date(Date.now() + nextDelay)
          : undefined,
    },
  });

  return success;
}

export async function retryWebhookDelivery(logId: string) {
  const log = await prisma.webhookDeliveryLog.findUnique({
    where: { id: logId },
    include: { endpoint: true },
  });
  if (!log || log.success || !log.endpoint.isActive) return;

  const nextRetry = log.retryCount + 1;
  if (nextRetry > RETRY_DELAYS_MS.length) {
    await prisma.webhookDeliveryLog.update({
      where: { id: logId },
      data: { nextRetryAt: null },
    });
    return;
  }

  const payload = log.payload as object;
  const success = await deliverWebhook(
    log.endpointId,
    log.endpoint.url,
    log.endpoint.secret,
    log.event,
    payload,
    nextRetry,
  );

  if (success) {
    await prisma.webhookDeliveryLog.update({
      where: { id: logId },
      data: { success: true, nextRetryAt: null },
    });
  }
}

export async function processDueWebhookRetries() {
  const due = await prisma.webhookDeliveryLog.findMany({
    where: {
      success: false,
      nextRetryAt: { lte: new Date() },
      retryCount: { lt: RETRY_DELAYS_MS.length },
    },
    take: 20,
  });

  for (const log of due) {
    await retryWebhookDelivery(log.id);
  }
}
