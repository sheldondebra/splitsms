import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mnotifyMaintenanceHold } from "../../../lib/sms/maintenance";
import { mapMnotifyStatus, canApplyDeliveryStatus } from "../../../lib/sms/delivery-status";
import { sendProviderSequence } from "../../../lib/sms/provider-sequence";

import { toMemberFacingFailureReason } from "../../../lib/sms/friendly-failure";

const params = { to: "+233240000000", from: "Test", body: "Test" };
const window = { MNOTIFY_MAINTENANCE_START: "2026-11-14T23:00:00Z", MNOTIFY_MAINTENANCE_END: "2026-11-15T01:00:00Z" };
describe("explicit maintenance instants", () => {
  it("is opt-in and respects both midnight boundaries", () => {
    assert.equal(mnotifyMaintenanceHold(0, {}).active, false);
    for (const [time, active] of [["2026-11-14T22:59:59Z", false], [window.MNOTIFY_MAINTENANCE_START, true], ["2026-11-15T00:59:59Z", true], [window.MNOTIFY_MAINTENANCE_END, false]] as const) {
      assert.equal(mnotifyMaintenanceHold(Date.parse(time), window).active, active);
    }
  });
  it("accepts explicit offsets and fails closed for missing/ambiguous/reversed configuration", () => {
    assert.equal(mnotifyMaintenanceHold(Date.parse("2026-11-14T23:30Z"), { MNOTIFY_MAINTENANCE_START: "2026-11-14T18:00:00-05:00", MNOTIFY_MAINTENANCE_END: "2026-11-14T20:00:00-05:00" }).active, true);
    for (const env of [{ MNOTIFY_MAINTENANCE_START: "2026-11-14T23:00:00" }, { ...window, MNOTIFY_MAINTENANCE_END: "bad" }, { ...window, MNOTIFY_MAINTENANCE_END: "2026-11-14T22:00Z" }]) {
      assert.equal(mnotifyMaintenanceHold(0, env).active, true);
    }
  });
});
describe("provider sequence", () => {
  function fixture(first: any) {
    const calls: string[] = [];
    const adapters = Object.fromEntries(["MNOTIFY", "INFOBIP", "TWILIO", "EASYSENDSMS"].map(type => [type, { type, send: async () => { calls.push(type); if (type === "MNOTIFY") { if (first instanceof Error) throw first; return first; } return { success: true, providerRef: "fallback" }; } }])) as any;
    return { calls, adapters };
  }
  it("stops on acceptance and never retries a duplicate primary", async () => {
    const { calls, adapters } = fixture({ success: false, error: "rejected" });
    const result = await sendProviderSequence(["MNOTIFY", "MNOTIFY", "INFOBIP"], params, adapters, true);
    assert.equal(result.provider, "INFOBIP"); assert.deepEqual(calls, ["MNOTIFY", "INFOBIP"]);
  });
  it("honors disabled failover", async () => {
    const { calls, adapters } = fixture({ success: false });
    await sendProviderSequence(["MNOTIFY", "INFOBIP"], params, adapters, false);
    assert.deepEqual(calls, ["MNOTIFY"]);
  });
  for (const first of [{ success: true }, { success: false, outcome: "unknown" }, { success: false, outcome: "deferred" }, new Error("timeout")]) {
    it(`does not fail over for ${JSON.stringify(first)}`, async () => {
      const { calls, adapters } = fixture(first);
      const result = await sendProviderSequence(["MNOTIFY", "INFOBIP"], params, adapters, true);
      assert.deepEqual(calls, ["MNOTIFY"]);
      if (first instanceof Error) assert.equal(result.outcome, "unknown");
    });
  }
});
describe("delivery report semantics", () => {
  it("distinguishes undelivered, pending and delivered", () => {
    for (const status of ["undelivered", "UNDELIVRD", "not delivered", "failed", "rejected", "expired"]) assert.equal(mapMnotifyStatus(status), "FAILED", status);
    for (const status of ["delivered", "DELIVRD", "success"]) assert.equal(mapMnotifyStatus(status), "DELIVERED", status);
    for (const status of ["", "submitted", "pending", "delivery pending", "unknown"]) assert.equal(mapMnotifyStatus(status), "SENT", status);
  });
  it("does not regress terminal states on reordered reports", () => {
    assert.equal(canApplyDeliveryStatus("SENT", "DELIVERED"), true);
    for (const current of ["DELIVERED", "FAILED", "EXPIRED", "REJECTED"]) {
      for (const next of ["SENT", "FAILED", "DELIVERED"]) assert.equal(canApplyDeliveryStatus(current, next), false);
    }
  });
});

it("explains held submissions without exposing internal markers", () => {
  for (const marker of ["provider-maintenance:", "submission-unknown:", "billing-refund-pending:"]) {
    assert.doesNotMatch(toMemberFacingFailureReason(`${marker} technical details`), /technical details|provider-maintenance|submission-unknown|billing-refund-pending/);
  }
});
