import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldIncludeSiteJsonLd } from "../../lib/seo/site-json-ld";

describe("shouldIncludeSiteJsonLd", () => {
  it("omits JSON-LD on the ads funnel so Network tab has no org payload", () => {
    assert.equal(shouldIncludeSiteJsonLd("/go"), false);
    assert.equal(shouldIncludeSiteJsonLd("/go/"), false);
  });

  it("keeps JSON-LD on public marketing pages", () => {
    assert.equal(shouldIncludeSiteJsonLd(null), true);
    assert.equal(shouldIncludeSiteJsonLd("/"), true);
    assert.equal(shouldIncludeSiteJsonLd("/pricing"), true);
  });
});
