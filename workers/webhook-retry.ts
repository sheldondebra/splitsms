import "dotenv/config";
import { processDueWebhookRetries } from "../lib/webhooks/dispatch";

console.log("Webhook retry worker running (every 60s)...");
setInterval(processDueWebhookRetries, 60_000);
processDueWebhookRetries();
