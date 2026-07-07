import { getSmsSendQueue, type SmsSendJob } from "@/lib/queue/sms-queue";
import { processMessageJob, resetStaleProcessingMessages } from "@/lib/queue/process-message";
import { smsWorkersEnabled } from "@/lib/queue/sms-workers-enabled";
import { SMS_INLINE_CONCURRENCY } from "@/lib/queue/sms-dispatch-config";
import { BULLMQ_PRIORITY } from "@/lib/enterprise/priority";
import type { MessagePriority } from "@/lib/generated/prisma/client";

async function processInlineBatch(
  jobs: Array<{ messageId: string; countryCode: string }>,
) {
  const concurrency = SMS_INLINE_CONCURRENCY;
  for (let i = 0; i < jobs.length; i += concurrency) {
    const batch = jobs.slice(i, i + concurrency);
    await Promise.all(
      batch.map(({ messageId, countryCode }) =>
        processMessageJob(messageId, countryCode, { skipStaleReset: true }),
      ),
    );
  }
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
export async function enqueueSmsJobsInline(
  jobs: Array<{ messageId: string; countryCode: string; priority?: MessagePriority }>,
) {
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
}
