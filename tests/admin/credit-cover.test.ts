import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  creditCoverPulse,
  creditCoverPulseMeters,
  creditCoverStatus,
  isCreditCoverAlertable,
  parseCreditCoverThreshold,
} from "../../lib/admin/credit-cover";

describe("parseCreditCoverThreshold", () => {
  it("floors a valid number and rejects junk", () => {
    assert.equal(parseCreditCoverThreshold("500"), 500);
    assert.equal(parseCreditCoverThreshold("1,200"), 1200);
    assert.equal(parseCreditCoverThreshold(-4, 50), 50);
    assert.equal(parseCreditCoverThreshold("nope", 50), 50);
  });
});

describe("creditCoverStatus", () => {
  it("is low when provider stock is under the threshold", () => {
    assert.equal(
      creditCoverStatus({ providerCredits: 40, memberCredits: 10, threshold: 50 }),
      "low",
    );
  });

  it("is underwater when members hold more credits than provider stock", () => {
    assert.equal(
      creditCoverStatus({ providerCredits: 80, memberCredits: 120, threshold: 50 }),
      "underwater",
    );
  });

  it("is ok when stock covers members and the threshold", () => {
    assert.equal(
      creditCoverStatus({ providerCredits: 500, memberCredits: 200, threshold: 50 }),
      "ok",
    );
  });

  it("is unknown when provider stock is missing", () => {
    assert.equal(
      creditCoverStatus({ providerCredits: null, memberCredits: 200, threshold: 50 }),
      "unknown",
    );
  });

  it("treats low and underwater as alertable", () => {
    assert.equal(isCreditCoverAlertable("low"), true);
    assert.equal(isCreditCoverAlertable("underwater"), true);
    assert.equal(isCreditCoverAlertable("ok"), false);
    assert.equal(isCreditCoverAlertable("unknown"), false);
  });
});

describe("creditCoverPulseMeters", () => {
  it("is green when surplus is a healthy share of stock", () => {
    const meters = creditCoverPulseMeters({
      memberCredits: 200,
      providerCredits: 500,
      cover: 300,
      threshold: 50,
    });
    assert.equal(meters.members.tone, "green");
    assert.equal(meters.stock.tone, "green");
    assert.equal(meters.cover.tone, "green");
    assert.equal(meters.members.pct, 40);
    assert.equal(meters.stock.pct, 60);
  });

  it("turns yellow when most stock is already sold", () => {
    const meters = creditCoverPulseMeters({
      memberCredits: 2731,
      providerCredits: 3433,
      cover: 702,
      threshold: 50,
    });
    assert.equal(meters.members.tone, "yellow");
    assert.equal(meters.stock.tone, "yellow");
    assert.equal(meters.cover.tone, "yellow");
  });

  it("turns red when cover is underwater", () => {
    const meters = creditCoverPulseMeters({
      memberCredits: 120,
      providerCredits: 80,
      cover: -40,
      threshold: 50,
    });
    assert.equal(meters.members.tone, "red");
    assert.equal(meters.stock.tone, "red");
    assert.equal(meters.cover.tone, "red");
    assert.equal(meters.cover.pct, 100);
  });

  it("is muted when provider stock is unknown", () => {
    const meters = creditCoverPulseMeters({
      memberCredits: 200,
      providerCredits: null,
      cover: null,
      threshold: 50,
    });
    assert.equal(meters.members.tone, "muted");
    assert.equal(meters.stock.pct, 0);
  });
});

describe("creditCoverPulse", () => {
  it("warns when members hold more credits than stock", () => {
    const pulse = creditCoverPulse({
      status: "underwater",
      memberCredits: 2713,
      providerCredits: 2051,
      cover: -662,
      threshold: 50,
    });
    assert.equal(pulse.tone, "danger");
    assert.match(pulse.detail, /662 short/);
  });

  it("is healthy when stock covers members", () => {
    const pulse = creditCoverPulse({
      status: "ok",
      memberCredits: 200,
      providerCredits: 500,
      cover: 300,
      threshold: 50,
    });
    assert.equal(pulse.tone, "ok");
    assert.match(pulse.detail, /300 surplus/);
  });
});
