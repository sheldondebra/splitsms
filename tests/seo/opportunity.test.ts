import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { opportunityScore, rankOpportunities } from "../../lib/seo/opportunity";

describe("opportunityScore", () => {
  it("scores higher for more impressions at weak position", () => {
    const weak = opportunityScore({ impressions: 1000, ctr: 0.01, position: 12 });
    const strong = opportunityScore({ impressions: 1000, ctr: 0.15, position: 2 });
    assert.ok(weak > strong);
  });

  it("returns 0 for zero impressions", () => {
    assert.equal(opportunityScore({ impressions: 0, ctr: 0, position: 50 }), 0);
  });
});

describe("rankOpportunities", () => {
  it("filters by minImpressions and sorts descending", () => {
    const ranked = rankOpportunities(
      [
        { keys: ["a"], clicks: 1, impressions: 10, ctr: 0.1, position: 5 },
        { keys: ["b"], clicks: 2, impressions: 500, ctr: 0.02, position: 15 },
        { keys: ["c"], clicks: 50, impressions: 400, ctr: 0.2, position: 1.5 },
      ],
      { minImpressions: 50 },
    );
    assert.equal(ranked.length, 2);
    assert.equal(ranked[0].label, "b");
    assert.ok(ranked[0].opportunityScore >= ranked[1].opportunityScore);
  });
});
