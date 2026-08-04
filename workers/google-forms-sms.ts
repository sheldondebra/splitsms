/**
 * Polls Google Form automations and queues SMS.
 * Run: npm run worker:google-forms
 * Or hit POST /api/cron/google-forms-sms with CRON_SECRET.
 */
import "dotenv/config";
import { pollAllGoogleFormAutomations } from "../lib/google/forms-sms";

const INTERVAL_MS = Number(process.env.GOOGLE_FORMS_POLL_MS ?? 45_000);

async function tick() {
  try {
    const result = await pollAllGoogleFormAutomations();
    console.log(
      `[google-forms] polled=${result.automations} processed=${result.processed}`,
    );
  } catch (err) {
    console.error("[google-forms] poll failed", err);
  }
}

console.log(`[google-forms] starting poller every ${INTERVAL_MS}ms`);
void tick();
setInterval(() => void tick(), INTERVAL_MS);
