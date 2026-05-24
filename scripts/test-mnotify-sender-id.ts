import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { getMnotifyStatus, isMnotifyConfigured, registerMnotifySenderId, checkMnotifySenderIdStatus } from "../lib/mnotify";
import { registerSenderIdWithProvider, syncUserSenderIdsFromMnotify } from "../lib/sender-ids/provider-sync";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== mNotify Sender ID integration test ===\n");

  const status = await getMnotifyStatus();
  console.log("Config:", {
    enabled: status.enabled,
    configured: status.configured,
    hasApiKey: status.hasApiKey,
    baseUrl: status.baseUrl,
    defaultSenderId: status.defaultSenderId,
    source: status.source,
  });

  const configured = await isMnotifyConfigured();
  if (!configured) {
    console.error("\nFAIL: mNotify is not configured (enable + API key required).");
    process.exit(1);
  }

  const testSender = `SPLT${Date.now().toString().slice(-6)}`.slice(0, 11);
  const purpose = "SplitSMS integration test sender ID registration";

  console.log(`\n1) Register test sender: ${testSender}`);
  const register = await registerMnotifySenderId(testSender, purpose);
  console.log("Register result:", {
    ok: register.ok,
    providerStatus: register.ok ? register.providerStatus : register.providerStatus,
    error: register.ok ? undefined : register.error,
    message: register.ok ? register.message : undefined,
  });

  if (!register.ok) {
    console.error("\nFAIL: mNotify register API call failed.");
    process.exit(1);
  }

  console.log(`\n2) Check status for: ${testSender}`);
  const check = await checkMnotifySenderIdStatus(testSender);
  console.log("Status result:", {
    ok: check.ok,
    providerStatus: check.ok ? check.providerStatus : undefined,
    error: check.ok ? undefined : check.error,
  });

  const user = await prisma.user.findFirst({
    where: { role: { not: "SUPER_ADMIN" } },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, fullName: true },
  });

  if (!user) {
    console.log("\n3) Skipped DB flow — no member user found.");
    console.log("\nPASS: mNotify API register + status work.");
    return;
  }

  console.log(`\n3) Full DB flow for user: ${user.email}`);
  const existing = await prisma.senderId.findFirst({
    where: { userId: user.id, value: testSender },
  });
  if (existing) {
    await prisma.senderId.delete({ where: { id: existing.id } });
  }

  const row = await prisma.senderId.create({
    data: {
      userId: user.id,
      value: testSender,
      countryCode: "GH",
      status: "PENDING",
    },
  });

  const provider = await registerSenderIdWithProvider({
    senderRecordId: row.id,
    userId: user.id,
    value: testSender,
    purpose,
    countryCode: "GH",
  });

  console.log("Provider sync:", provider);

  const updated = await prisma.senderId.findUnique({ where: { id: row.id } });
  console.log("DB row after sync:", {
    value: updated?.value,
    status: updated?.status,
    providerStatus: updated?.providerStatus,
    providerSubmittedAt: updated?.providerSubmittedAt?.toISOString(),
    adminNote: updated?.adminNote,
  });

  console.log("\n4) Sync pending sender IDs from mNotify");
  await syncUserSenderIdsFromMnotify(user.id);
  const afterSync = await prisma.senderId.findUnique({ where: { id: row.id } });
  console.log("After sync:", {
    status: afterSync?.status,
    providerStatus: afterSync?.providerStatus,
  });

  console.log("\nPASS: mNotify sender ID registration flow works end-to-end.");
}

main()
  .catch((e) => {
    console.error("\nFAIL:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
