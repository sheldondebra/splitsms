/**
 * Report worker — polls mNotify delivery reports for recently sent messages.
 * Run: npm run worker:reports
 * Requires REDIS_URL optional; uses DB + mNotify API only.
 */
import "dotenv/config";
import { syncPendingMnotifyDeliveries } from "@/lib/sms/sync-mnotify-dlr";

const INTERVAL_MS = 60_000;

async function tick() {
  try {
    const result = await syncPendingMnotifyDeliveries(30);
    console.log(
      `[report-worker] synced ${result.campaigns} campaigns, ${result.rowsUpdated} rows`,
    );
  } catch (e) {
    console.error("[report-worker]", e);
  }
}

console.log("Report sync worker running (mNotify DLR poll every 60s)...");
void tick();
setInterval(tick, INTERVAL_MS);
