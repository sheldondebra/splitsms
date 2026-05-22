import { Worker } from "bullmq";
import { getRedisConnection } from "@/lib/queue/connection";
import { SMS_SEND_QUEUE, type SmsSendJob } from "@/lib/queue/sms-queue";
import { processMessageJob } from "@/lib/queue/process-message";

const connection = getRedisConnection();
if (!connection) {
  console.error("REDIS_URL not set — worker exiting");
  process.exit(1);
}

new Worker<SmsSendJob>(
  SMS_SEND_QUEUE,
  async (job) => {
    await processMessageJob(job.data.messageId, job.data.countryCode);
  },
  { connection, concurrency: 10 },
);

console.log("SMS send worker running...");
