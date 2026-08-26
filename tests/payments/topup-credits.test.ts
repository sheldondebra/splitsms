import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readTopUpCreditMeta } from "../../lib/payments/topup-credit-meta";

describe("readTopUpCreditMeta", () => {
  it("reads the auto-buy flag and converted totals", () => {
    const meta = readTopUpCreditMeta({
      buyCreditsOnFund: true,
      creditCountryCode: "gh",
      creditsConvertedAt: "2026-08-21T12:00:00.000Z",
      creditsConverted: 200,
      creditsConvertedCost: 10,
    });

    assert.equal(meta.buyCreditsOnFund, true);
    assert.equal(meta.creditCountryCode, "GH");
    assert.equal(meta.creditsConverted, 200);
    assert.equal(meta.creditsConvertedCost, 10);
  });

  it("ignores missing or invalid metadata", () => {
    assert.deepEqual(readTopUpCreditMeta(null), {});
    assert.equal(readTopUpCreditMeta({ buyCreditsOnFund: "yes" }).buyCreditsOnFund, false);
  });
});
