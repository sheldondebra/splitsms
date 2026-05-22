import { Queue } from "bullmq";
import { getRedisConnection } from "./connection";

export const SMS_SEND_QUEUE = "sms-send";

export function getSmsSendQueue() {
  const connection = getRedisConnection();
  if (!connection) return null;
  return new Queue(SMS_SEND_QUEUE, { connection });
}

export type SmsSendJob = {
  messageId: string;
  countryCode: string;
};
