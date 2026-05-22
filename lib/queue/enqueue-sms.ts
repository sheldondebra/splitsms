import { getSmsSendQueue, type SmsSendJob } from "@/lib/queue/sms-queue";
import { processMessageJob } from "@/lib/queue/process-message";
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

  if (queue) {
    await queue.add("send", job, {
      priority: bullPriority,
      removeOnComplete: true,
    });
  } else {
    await processMessageJob(messageId, countryCode);
  }
}
