/** When true, enqueue to BullMQ (requires `npm run worker:sms` on a separate host). */
export function smsWorkersEnabled() {
  return process.env.SMS_WORKERS_ENABLED === "true";
}
