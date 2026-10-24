import assert from "node:assert/strict";
import { it, mock, beforeEach } from "node:test";
const mod = (path: string) => new URL(`../../../lib/${path}.ts`, import.meta.url).href;
let balance = 0, ledger: any[] = [], reversed = 0, failLedger = false, enterprise = false, used = 1;
let refundProcessed = false;
let chain = Promise.resolve();
const events: string[] = [];
const prisma = {
  $transaction: async (run: any) => {
    const prior = chain; let unlock!: () => void;
    chain = new Promise<void>(resolve => { unlock = resolve; });
    await prior;
    const originalBalance = balance, originalLedger = [...ledger], originalUsed = used, originalRefundProcessed = refundProcessed;
    const tx = {
      $queryRaw: async () => { events.push("lock"); return [{ id: "m1", refundProcessed }]; },
      message: { update: async () => { refundProcessed = true; } },
      transaction: {
        findFirst: async ({ where }: any) => { assert.ok(events.includes("lock")); return ledger.find(x => x.metadata.messageId === where.metadata.equals); },
        create: async ({data}: any) => { if (failLedger) throw new Error("ledger unavailable"); ledger.push(data); },
      },
      enterpriseAccount: { findUnique: async () => enterprise ? { id: "e1", credit: {} } : null },
      enterpriseCredit: {
        findUniqueOrThrow: async () => ({ usedCredit: { toNumber: () => used } }),
        update: async ({ data }: any) => { used -= data.usedCredit.decrement; },
      },
      smsCredit: { upsert: async ({ update }: any) => { balance += update.balance.increment; return { balance }; } },
    };
    try { return await run(tx); }
    catch (e) { balance = originalBalance; ledger = originalLedger; used = originalUsed; refundProcessed = originalRefundProcessed; throw e; }
    finally { unlock(); }
  },
};
mock.module(mod("db"), { namedExports: { prisma } });
mock.module(mod("reseller/pricing"), { namedExports: { resolveSmsPriceForUser: async () => ({creditsPerSms: 1}) } });
mock.module(mod("reseller/commission"), { namedExports: { reverseSmsCommission: async () => { reversed++; } } });
const { refundMessageBilling } = await import("../../../lib/sms/message-billing");
const message = {id: "m1", userId: "u1", channel: "campaign", smsUnits: 2, countryCode: "GH", recipient: "test", cost: {toNumber: () => 0.1}};
beforeEach(() => { balance = 0; ledger = []; reversed = 0; failLedger = false; enterprise = false; used = 1; events.length = 0; refundProcessed = false; });
it("credits once for concurrent and replayed refunds", async () => {
  await Promise.all([refundMessageBilling(message, "GHS", "first"), refundMessageBilling(message, "GHS", "replay")]);
  assert.equal(balance, 2); assert.equal(ledger.length, 1); assert.equal(reversed, 1);
  assert.equal(ledger[0].metadata.messageId, "m1");
});
it("rolls back the credit if the refund ledger cannot commit, then allows recovery", async () => {
  failLedger = true;
  await assert.rejects(refundMessageBilling(message, "GHS", "first"), /ledger unavailable/);
  assert.equal(balance, 0); assert.equal(ledger.length, 0);
  failLedger = false; await refundMessageBilling(message, "GHS", "retry"); assert.equal(balance, 2);
});
it("releases enterprise credit once without adding SMS credits", async () => {
  enterprise = true;
  const smpp = {...message, channel: "smpp"};
  await Promise.all([refundMessageBilling(smpp, "GHS", "first"), refundMessageBilling(smpp, "GHS", "replay")]);
  assert.equal(used, 0.9); assert.equal(balance, 0); assert.equal(ledger.length, 1); assert.equal(ledger[0].metadata.instrument, "enterprise_credit");
});
it("requires a durable message ID", async () => { await assert.rejects(refundMessageBilling({...message, id: undefined}, "GHS", "missing"), /durable message ID/); });

it("allows a newly billed retry to receive its own refund", async () => {
  await refundMessageBilling(message, "GHS", "first failure");
  // Paid retry paths reset the durable receipt after debiting the new attempt.
  refundProcessed = false;
  await refundMessageBilling(message, "GHS", "retry failure");
  assert.equal(balance, 4); assert.equal(ledger.length, 2);
});
