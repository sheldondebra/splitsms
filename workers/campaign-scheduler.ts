import "dotenv/config";
import { dispatchCampaign } from "../lib/campaigns/dispatch";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { createNotification } from "../lib/notifications";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function tick() {
  const due = await prisma.campaign.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: new Date() },
    },
    take: 10,
  });

  for (const c of due) {
    await createNotification(
      c.userId,
      "SYSTEM",
      "Scheduled campaign started",
      `"${c.name}" is now sending.`,
      { campaignId: c.id },
    );
    const result = await dispatchCampaign(c.id);
    console.log(`Campaign ${c.id}:`, result.ok ? "dispatched" : result.reason);
  }
}

console.log("Campaign scheduler running (every 60s)...");
setInterval(tick, 60_000);
tick();
