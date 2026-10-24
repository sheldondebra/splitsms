import assert from "node:assert/strict";
import { it, mock } from "node:test";
const mod = (path: string) => new URL(`../../../lib/${path}.ts`, import.meta.url).href;
let state = "SCHEDULED", debits = 0, messages = 0, sends = 0;
const campaign = { id: "c1", userId: "u1", status: state, countryCode: "GH", name: "Test", senderId: "Test", message: "Test", contactGroup: null, messages: [{recipient: "+233240000000",body: "Test"}] };
mock.module(mod("db"), { namedExports: { prisma: {
  campaign: {
    findUnique: async () => ({...campaign, status: state}),
    updateMany: async () => { if (state !== "SCHEDULED") return {count: 0}; state = "SENDING"; return {count: 1}; },
    update: async () => {},
  },
  smsPricing: { findFirst: async () => null }, wallet: { findUnique: async () => ({currency: "GHS"}) },
  message: { createManyAndReturn: async () => { messages++; return [{id: "m1"}]; } },
} } });
mock.module(mod("sms/billing"), { namedExports: { deductSmsCredits: async () => {debits++;} } });
mock.module(mod("queue/enqueue-sms"), { namedExports: { enqueueSmsJobsInline: async () => {sends++;} } });
mock.module(mod("notifications"), { namedExports: { createNotification: async () => {} } });
const { dispatchCampaign } = await import("../../../lib/campaigns/dispatch");
it("allows only one competing scheduler to debit and create campaign messages", async () => {
  const results = await Promise.all([dispatchCampaign("c1"), dispatchCampaign("c1")]);
  assert.equal(results.filter(x => x.ok).length, 1); assert.equal(debits, 1); assert.equal(messages, 1); assert.equal(sends, 1);
  assert.equal((await dispatchCampaign("c1")).ok, false); assert.equal(debits, 1);
});
