import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyProviderProbe,
  sanitizeProbePayload,
} from "../../lib/sms/provider-probe";

describe("classifyProviderProbe", () => {
  it("skips unconfigured providers", () => {
    assert.equal(
      classifyProviderProbe({ configured: false, httpOk: true, latencyMs: 120 }),
      "skipped",
    );
  });

  it("marks failed HTTP as bad", () => {
    assert.equal(
      classifyProviderProbe({ configured: true, httpOk: false, latencyMs: 80 }),
      "bad",
    );
  });

  it("marks a fast success as good", () => {
    assert.equal(
      classifyProviderProbe({ configured: true, httpOk: true, latencyMs: 400 }),
      "good",
    );
  });

  it("marks a slow success as okay", () => {
    assert.equal(
      classifyProviderProbe({ configured: true, httpOk: true, latencyMs: 3100 }),
      "ok",
    );
  });
});

describe("sanitizeProbePayload", () => {
  it("redacts secret keys and truncates long strings", () => {
    const out = sanitizeProbePayload({
      balance: 12.5,
      apiKey: "super-secret-token",
      authorization: "Bearer abc",
      note: "x".repeat(300),
    });
    assert.match(out, /\[redacted\]/);
    assert.doesNotMatch(out, /super-secret-token/);
    assert.doesNotMatch(out, /Bearer abc/);
    assert.match(out, /…/);
    assert.match(out, /12\.5/);
  });
});
