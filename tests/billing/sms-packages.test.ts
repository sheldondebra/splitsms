import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { creditsFromAmount, packageTotalCost } from "../../lib/billing/sms-packages";

describe("creditsFromAmount", () => {
  it("uses the assigned unit cost, not a hardcoded rate", () => {
    assert.deepEqual(creditsFromAmount(10, 0.05), { credits: 200, cost: 10, remainder: 0 });
    assert.deepEqual(creditsFromAmount(10, 0.03), { credits: 333, cost: 9.99, remainder: 0.01 });
  });

  it("returns zero credits for invalid amounts or rates", () => {
    assert.equal(creditsFromAmount(0, 0.05).credits, 0);
    assert.equal(creditsFromAmount(10, 0).credits, 0);
    assert.equal(creditsFromAmount(Number.NaN, 0.05).credits, 0);
  });

  it("keeps leftover change in the wallet", () => {
    const quote = creditsFromAmount(1, 0.03);
    assert.equal(quote.credits, 33);
    assert.equal(quote.cost, packageTotalCost(33, 0.03));
    assert.equal(quote.remainder, 0.01);
  });
});
