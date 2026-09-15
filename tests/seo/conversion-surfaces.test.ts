import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { softwareApplicationJsonLd } from "../../lib/seo/site";

describe("software application schema", () => {
  it("advertises free credits on signup", () => {
    const json = softwareApplicationJsonLd("/");
    assert.equal(json["@type"], "SoftwareApplication");
    assert.match(String(json.offers.description), /5 free credits/i);
  });
});

describe("marketing sitemap and robots", () => {
  it("lists conversion landings and blocks auth crawl budget", () => {
    const sitemap = readFileSync(new URL("../../app/sitemap.ts", import.meta.url), "utf8");
    const robots = readFileSync(new URL("../../app/robots.ts", import.meta.url), "utf8");
    assert.match(sitemap, /\/products\/bulk-sms/);
    assert.match(sitemap, /\/reseller-platform/);
    assert.match(sitemap, /\/docs\/wordpress/);
    assert.match(robots, /\/login/);
    assert.match(robots, /\/signup/);
    assert.match(robots, /\/em\//);
  });
});
