import "dotenv/config";
import { processDueScheduledCampaigns } from "../lib/campaigns/scheduler";

async function tick() {
  const { processed, results } = await processDueScheduledCampaigns(10);
  for (const r of results) {
    console.log(`Campaign ${r.id}:`, r.ok ? "dispatched" : r.reason);
  }
  if (processed > 0) {
    console.log(`Processed ${processed} scheduled campaign(s)`);
  }
}

console.log("Campaign scheduler running (every 60s)...");
setInterval(tick, 60_000);
tick();
