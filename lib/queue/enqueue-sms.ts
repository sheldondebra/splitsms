import { getSmsSendQueue, type SmsSendJob } from "@/lib/queue/sms-queue";
import { processMessageJob, resetStaleProcessingMessages } from "@/lib/queue/process-message";
import { smsWorkersEnabled } from "@/lib/queue/sms-workers-enabled";
import {
  SMS_FAST_AWAIT_LIMIT,
  SMS_INLINE_CONCURRENCY,
} from "@/lib/queue/sms-dispatch-config";
import { BULLMQ_PRIORITY } from "@/lib/enterprise/priority";
import type { MessagePriority } from "@/lib/generated/prisma/client";

export type SmsDispatchJob = {
  messageId: string;
  countryCode: string;
  priority?: MessagePriority;
};

async function processInlineBatch(
  jobs: Array<{ messageId: string; countryCode: string }>,
) {
  const concurrency = SMS_INLINE_CONCURRENCY;
  for (let i = 0; i < jobs.length; i += concurrency) {
    const batch = jobs.slice(i, i + concurrency);
    await Promise.all(
      batch.map(({ messageId, countryCode }) =>
        processMessageJob(messageId, countryCode, {
          skipStaleReset: true,
          skipCampaignSync: true,
        }),
      ),
    );
  }
}

/** Small / time-sensitive sends should not wait on `after()` scheduling. */
export function shouldAwaitSmsDispatch(jobs: SmsDispatchJob[]): boolean {
  if (jobs.length === 0) return false;
  if (jobs.length <= SMS_FAST_AWAIT_LIMIT) return true;
  return jobs.every((j) => j.priority === "CRITICAL");
}

export async function enqueueSmsJob(
  messageId: string,
  countryCode: string,
  priority: MessagePriority = "MEDIUM",
) {
  const job: SmsSendJob = { messageId, countryCode };
  const queue = getSmsSendQueue();
  const bullPriority = BULLMQ_PRIORITY[priority];

  if (queue && smsWorkersEnabled()) {
    try {
      await queue.add("send", job, {
        jobId: messageId,
        priority: bullPriority,
        removeOnComplete: true,
      });
      return;
    } catch (err) {
      console.error("[enqueueSmsJob] queue add failed, sending inline", messageId, err);
    }
  }

  await resetStaleProcessingMessages();
  await processMessageJob(messageId, countryCode, { skipStaleReset: true });
}

/** Process many PENDING messages without blocking on BullMQ (Vercel-safe). */
export async function enqueueSmsJobsInline(jobs: SmsDispatchJob[]) {
  if (jobs.length === 0) return;

  const queue = getSmsSendQueue();
  if (queue && smsWorkersEnabled()) {
    await Promise.all(
      jobs.map(({ messageId, countryCode, priority = "MEDIUM" }) =>
        enqueueSmsJob(messageId, countryCode, priority),
      ),
    );
    return;
  }

  await resetStaleProcessingMessages();
  await processInlineBatch(
    jobs.map(({ messageId, countryCode }) => ({ messageId, countryCode })),
  );

  const { prisma } = await import("@/lib/db");
  const { syncCampaignStatus } = await import("@/lib/campaigns/sync-status");
  const rows = await prisma.message.findMany({
    where: { id: { in: jobs.map((j) => j.messageId) } },
    select: { campaignId: true },
  });
  const campaignIds = [
    ...new Set(rows.map((r) => r.campaignId).filter((id): id is string => Boolean(id))),
  ];
  await Promise.all(campaignIds.map((id) => syncCampaignStatus(id)));
}
