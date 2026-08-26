import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { verifySmartFormRecaptcha } from "../../lib/smart-forms/security";

describe("verifySmartFormRecaptcha", () => {
  it("skips Google when the form does not enable security", async () => {
    let called = false;
    const result = await verifySmartFormRecaptcha({
      enabled: false,
      token: "",
      siteKey: "site",
      secret: "secret",
      verifyToken: async () => {
        called = true;
        return { ok: true };
      },
    });
    assert.equal(called, false);
    assert.deepEqual(result, { ok: true });
  });

  it("rejects a bot with no token when reCAPTCHA is configured", async () => {
    const result = await verifySmartFormRecaptcha({
      enabled: true,
      token: "  ",
      siteKey: "site",
      secret: "secret",
    });
    assert.deepEqual(result, {
      ok: false,
      error: "Couldn’t verify this submission. Refresh and try again.",
    });
  });

  it("rejects a low Google score for the smart_form action", async () => {
    const result = await verifySmartFormRecaptcha({
      enabled: true,
      token: "bot-token",
      siteKey: "site",
      secret: "secret",
      minScore: 0.5,
      ip: "1.1.1.1",
      verifyToken: async (input) => {
        assert.equal(input.expectedAction, "smart_form");
        assert.equal(input.token, "bot-token");
        return { ok: false, reason: "low_score" };
      },
    });
    assert.deepEqual(result, {
      ok: false,
      error: "Couldn’t verify this submission. Refresh and try again.",
    });
  });

  it("accepts a valid hidden reCAPTCHA token", async () => {
    const result = await verifySmartFormRecaptcha({
      enabled: true,
      token: "ok-token",
      siteKey: "site",
      secret: "secret",
      verifyToken: async () => ({ ok: true }),
    });
    assert.deepEqual(result, { ok: true });
  });

  it("does not fail open when only one reCAPTCHA key is set", async () => {
    const result = await verifySmartFormRecaptcha({
      enabled: true,
      token: "ok-token",
      siteKey: "site",
      secret: undefined,
    });
    assert.deepEqual(result, {
      ok: false,
      error: "Couldn’t verify this submission. Refresh and try again.",
    });
  });

  it("skips Google when security is on but reCAPTCHA keys are not configured", async () => {
    let called = false;
    const result = await verifySmartFormRecaptcha({
      enabled: true,
      token: "",
      siteKey: undefined,
      secret: undefined,
      verifyToken: async () => {
        called = true;
        return { ok: true };
      },
    });
    assert.equal(called, false);
    assert.deepEqual(result, { ok: true });
  });
});
