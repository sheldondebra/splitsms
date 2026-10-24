import assert from "node:assert/strict";
import { it, mock, beforeEach, afterEach } from "node:test";
const mod = (path: string) => new URL(`../../../lib/${path}.ts`, import.meta.url).href;
let row: any;
let sends = 0, refunds = 0, hooks = 0;
let result: any;
const prisma = {
  message: {
    findUnique: async () => row ? { ...row } : null,
    findFirst: async () => row ? { ...row } : null,
    updateMany: async ({ where, data }: any) => {
      if (where.id && (row.id !== where.id || row.status !== where.status || ("providerRef" in where && row.providerRef !== where.providerRef))) return { count: 0 };
      Object.assign(row, data); return { count: 1 };
    },
    update: async ({ data }: any) => { Object.assign(row, data); return { ...row }; },
  },
  enterpriseAccount: { findUnique: async () => null },
  memberAccount: { findUnique: async () => null },
  wallet: { findUnique: async () => ({ currency: "GHS" }) },
};
mock.module(mod("db"), { namedExports: { prisma } });
mock.module(mod("sms/orchestrator"), { namedExports: { sendSmsWithFailover: async () => { sends++; return result; } } });
mock.module(mod("sms/message-billing"), { namedExports: { refundMessageBilling: async () => { refunds++; } } });
mock.module(mod("webhooks/dispatch"), { namedExports: { dispatchUserWebhooks: async () => { hooks++; } } });
mock.module(mod("campaigns/sync-status"), { namedExports: { syncCampaignStatus: async () => {} } });
mock.module(mod("sms/sync-mnotify-dlr"), { namedExports: { syncMnotifyCampaignDelivery: async () => ({ok: true}), syncMnotifyDeliveryAfterSend: async () => {} } });
mock.module(mod("slack/notify"), { namedExports: { notifySlackSmsFailed: async () => {} } });
const { processMessageJob, applyMessageDeliveryStatus, resetStaleProcessingMessages } = await import("../../../lib/queue/process-message");
const { forceResendSlowDeliveryMessage, watchDeliveryAndForceResend, forceResendSlowDeliveries } = await import("../../../lib/sms/force-resend-slow-delivery");
beforeEach(() => {
  row = { id: "m1", userId: "u1", status: "PENDING", recipient: "+233240000000", senderId: "Test", body: "Test", countryCode: "GH", providerRef: null, providerType: null, user: { wallet: { currency: "GHS" } } };
  sends = 0; refunds = 0; hooks = 0;
});
afterEach(() => { delete process.env.MNOTIFY_MAINTENANCE_START; delete process.env.MNOTIFY_MAINTENANCE_END; });
it("holds maintenance sends without refund and resumes after the hold", async () => {
  result = { success: false, outcome: "deferred", provider: "MNOTIFY", error: "maintenance" };
  await processMessageJob("m1", "GH", { skipStaleReset: true });
  assert.equal(row.status, "PENDING"); assert.match(row.failureReason, /^provider-maintenance:/); assert.equal(refunds, 0);
  process.env.MNOTIFY_MAINTENANCE_START = "2020-01-01T00:00Z"; process.env.MNOTIFY_MAINTENANCE_END = "2040-01-01T00:00Z";
  await processMessageJob("m1", "GH", { skipStaleReset: true }); assert.equal(sends, 1);
  delete process.env.MNOTIFY_MAINTENANCE_START; delete process.env.MNOTIFY_MAINTENANCE_END;
  result = { success: true, provider: "TWILIO", providerRef: "accepted-1" };
  await processMessageJob("m1", "GH", { skipStaleReset: true });
  assert.equal(row.status, "SENT"); assert.equal(row.providerRef, "accepted-1"); assert.equal(sends, 2); assert.equal(refunds, 0);
});
it("quarantines unknown acceptance and ignores repeated worker jobs", async () => {
  result = { success: false, outcome: "unknown", provider: "MNOTIFY", error: "timeout" };
  await processMessageJob("m1", "GH", { skipStaleReset: true });
  await processMessageJob("m1", "GH", { skipStaleReset: true });
  assert.equal(row.status, "PROCESSING"); assert.match(row.failureReason, /^submission-unknown:/); assert.equal(sends, 1); assert.equal(refunds, 0);
});
it("does not put interrupted PROCESSING sends back into PENDING", async () => {
  row.status = "PROCESSING";
  await resetStaleProcessingMessages();
  assert.equal(row.status, "PROCESSING"); assert.match(row.failureReason, /^submission-unknown:/);
});
it("uses compare-and-set for competing delivered and failed reports", async () => {
  row.status = "SENT"; row.providerRef = "ref-1";
  await Promise.all([applyMessageDeliveryStatus("m1", "DELIVERED", "ref-1"), applyMessageDeliveryStatus("m1", "FAILED", "ref-1")]);
  assert.equal(row.status, "DELIVERED"); assert.equal(refunds, 0); assert.equal(hooks, 1);
  await applyMessageDeliveryStatus("m1", "SENT", "ref-1"); assert.equal(row.status, "DELIVERED");
});
it("ignores stale reports for a different provider reference", async () => {
  row.status = "SENT"; row.providerRef = "new-ref";
  await applyMessageDeliveryStatus("m1", "FAILED", "old-ref");
  assert.equal(row.status, "SENT"); assert.equal(refunds, 0);
});
it("does not resend accepted SMS with a delayed report, through any legacy entry point", async () => {
  row.status = "SENT"; row.providerType = "MNOTIFY"; row.providerRef = "accepted-1";
  const original = { ...row };
  assert.equal(await forceResendSlowDeliveryMessage("m1"), "skipped");
  await watchDeliveryAndForceResend("m1");
  assert.equal((await forceResendSlowDeliveries()).resent, 0);
  assert.equal(sends, 0); assert.equal(refunds, 0); assert.equal(row.providerRef, original.providerRef); assert.equal(row.status, "SENT");
});

it("does not issue a new refund for legacy FAILED messages without a pending-refund marker", async () => {
  row.status = "FAILED"; row.providerRef = "legacy-ref"; row.failureReason = "Delivery failed";
  await applyMessageDeliveryStatus("m1", "FAILED", "legacy-ref");
  assert.equal(refunds, 0);
});
