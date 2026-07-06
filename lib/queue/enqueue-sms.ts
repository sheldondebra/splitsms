import { getSmsSendQueue, type SmsSendJob } from "@/lib/queue/sms-queue";
import { processMessageJob } from "@/lib/queue/process-message";
import { smsWorkersEnabled } from "@/lib/queue/sms-workers-enabled";
import { BULLMQ_PRIORITY } from "@/lib/enterprise/priority";
import type { MessagePriority } from "@/lib/generated/prisma/client";

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

  await processMessageJob(messageId, countryCode);
}

/** Process many PENDING messages without blocking on BullMQ (Vercel-safe). */
export async function enqueueSmsJobsInline(
  jobs: Array<{ messageId: string; countryCode: string; priority?: MessagePriority }>,
) {
  const queue = getSmsSendQueue();
  if (queue && smsWorkersEnabled()) {
    await Promise.all(
      jobs.map(({ messageId, countryCode, priority = "MEDIUM" }) =>
        enqueueSmsJob(messageId, countryCode, priority),
      ),
    );
    return;
  }

  const concurrency = 5;
  for (let i = 0; i < jobs.length; i += concurrency) {
    const batch = jobs.slice(i, i + concurrency);
    await Promise.all(
      batch.map(({ messageId, countryCode }) => processMessageJob(messageId, countryCode)),
    );
  }
}
