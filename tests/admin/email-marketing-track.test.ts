import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyEmailMarketingTracking,
  emailMarketingTrackingToken,
  parseEmailMarketingTrackingToken,
  safeClickRedirect,
  wrapTrackingLinks,
} from "../../lib/admin/email-marketing-track";

describe("email marketing tracking tokens", () => {
  it("round-trips a delivery id", () => {
    const token = emailMarketingTrackingToken("clxyz123");
    assert.equal(parseEmailMarketingTrackingToken(token), "clxyz123");
  });

  it("rejects a tampered token", () => {
    const token = emailMarketingTrackingToken("clxyz123");
    assert.equal(parseEmailMarketingTrackingToken(`${token}x`), null);
    assert.equal(parseEmailMarketingTrackingToken("not-a-token"), null);
  });
});

describe("email marketing link wrapping", () => {
  it("wraps http links and skips mailto, hash, and tracking urls", () => {
    const html = [
      '<a href="https://www.splitsms.com/pricing">Pricing</a>',
      '<a href="mailto:hello@splitsms.com">Mail</a>',
      '<a href="#section">Skip</a>',
      '<a href="https://www.splitsms.com/em/u/abc.def">Unsub</a>',
    ].join("");
    const wrapped = wrapTrackingLinks(html, "deliv.sig");
    assert.match(wrapped, /\/em\/c\/deliv\.sig\?u=/);
    assert.match(wrapped, /mailto:hello@splitsms.com/);
    assert.match(wrapped, /href="#section"/);
    assert.match(wrapped, /\/em\/u\/abc\.def/);
  });

  it("adds an open pixel before </body>", () => {
    const html = applyEmailMarketingTracking(
      '<html><body><a href="https://example.com/x">Go</a></body></html>',
      "deliv.sig",
    );
    assert.match(html, /\/em\/o\/deliv\.sig/);
    assert.match(html, /\/em\/c\/deliv\.sig\?u=/);
  });
});

describe("click redirect safety", () => {
  it("allows http(s) and rejects javascript", () => {
    assert.equal(safeClickRedirect("https://www.splitsms.com/signup"), "https://www.splitsms.com/signup");
    assert.equal(safeClickRedirect("javascript:alert(1)"), null);
    assert.equal(safeClickRedirect("not a url"), null);
  });
});
