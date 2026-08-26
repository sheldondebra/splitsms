import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  liveUpdateNavStatusPayload,
  resolveLiveUpdateNavState,
} from "../../lib/admin/live-update-nav";

describe("live-update nav status payload", () => {
  it("returns only a state key — no events, recipients, or member data", () => {
    const payload = liveUpdateNavStatusPayload({
      pending: 3,
      processing: 1,
      failedLast15m: 0,
      sendingCampaigns: 1,
    });

    assert.deepEqual(Object.keys(payload).sort(), ["state"]);
    assert.equal(payload.state, "busy");
    assert.equal("events" in payload, false);
    assert.equal("campaigns" in payload, false);
    assert.equal("stats" in payload, false);
  });

  it("marks failed traffic as error", () => {
    assert.equal(
      resolveLiveUpdateNavState({
        pending: 0,
        processing: 0,
        failedLast15m: 2,
        sendingCampaigns: 0,
      }),
      "error",
    );
  });

  it("is idle when queues are empty", () => {
    assert.equal(
      resolveLiveUpdateNavState({
        pending: 0,
        processing: 0,
        failedLast15m: 0,
        sendingCampaigns: 0,
      }),
      "idle",
    );
  });
});
