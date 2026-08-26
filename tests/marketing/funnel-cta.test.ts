import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildFunnelCtaHref } from "../../lib/marketing/funnel-cta";

describe("buildFunnelCtaHref", () => {
  it("sends signed-in visitors to the dashboard", () => {
    assert.equal(
      buildFunnelCtaHref({ utm_source: "meta" }, { signedIn: true }),
      "/dashboard",
    );
  });

  it("tags signup with from=go when there are no tracking params", () => {
    assert.equal(buildFunnelCtaHref({}, { signedIn: false }), "/signup?from=go");
  });

  it("forwards allowlisted tracking params", () => {
    const href = buildFunnelCtaHref(
      {
        utm_source: "meta",
        utm_campaign: "ghana-sms",
        gclid: "abc",
        r: "invite1",
        extra: "drop-me",
      },
      { signedIn: false },
    );
    const url = new URL(href, "https://www.splitsms.com");
    assert.equal(url.pathname, "/signup");
    assert.equal(url.searchParams.get("from"), "go");
    assert.equal(url.searchParams.get("utm_source"), "meta");
    assert.equal(url.searchParams.get("utm_campaign"), "ghana-sms");
    assert.equal(url.searchParams.get("gclid"), "abc");
    assert.equal(url.searchParams.get("r"), "invite1");
    assert.equal(url.searchParams.get("extra"), null);
  });

  it("uses the first value when a param is duplicated", () => {
    const href = buildFunnelCtaHref(
      { utm_source: ["facebook", "google"] },
      { signedIn: false },
    );
    const url = new URL(href, "https://www.splitsms.com");
    assert.equal(url.searchParams.get("utm_source"), "facebook");
  });
});
