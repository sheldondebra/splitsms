import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evaluateRecaptchaSiteVerify,
  parseRecaptchaMinScore,
  recaptchaEnforcement,
  verifyRecaptchaToken,
} from "../../lib/auth/recaptcha";

describe("parseRecaptchaMinScore", () => {
  it("defaults to 0.5 and clamps invalid values", () => {
    assert.equal(parseRecaptchaMinScore(undefined), 0.5);
    assert.equal(parseRecaptchaMinScore(""), 0.5);
    assert.equal(parseRecaptchaMinScore("nope"), 0.5);
    assert.equal(parseRecaptchaMinScore("0.7"), 0.7);
    assert.equal(parseRecaptchaMinScore("2"), 1);
    assert.equal(parseRecaptchaMinScore("-1"), 0);
  });
});

describe("recaptchaEnforcement", () => {
  it("skips when neither key is set (local dev)", () => {
    assert.equal(recaptchaEnforcement({ siteKey: undefined, secret: undefined }), "off");
  });

  it("fails closed in production when captcha keys are missing", () => {
    assert.equal(
      recaptchaEnforcement({
        siteKey: undefined,
        secret: undefined,
        production: true,
      }),
      "misconfigured",
    );
  });

  it("enforces when both keys are set", () => {
    assert.equal(
      recaptchaEnforcement({ siteKey: "site", secret: "secret" }),
      "required",
    );
  });

  it("rejects misconfiguration instead of failing open", () => {
    assert.equal(
      recaptchaEnforcement({ siteKey: "site", secret: undefined }),
      "misconfigured",
    );
    assert.equal(
      recaptchaEnforcement({ siteKey: undefined, secret: "secret" }),
      "misconfigured",
    );
  });
});

describe("evaluateRecaptchaSiteVerify", () => {
  const opts = { minScore: 0.5, expectedAction: "signup" };

  it("rejects unsuccessful Google responses", () => {
    assert.deepEqual(evaluateRecaptchaSiteVerify({ success: false }, opts), {
      ok: false,
      reason: "invalid",
    });
    assert.deepEqual(evaluateRecaptchaSiteVerify({}, opts), {
      ok: false,
      reason: "invalid",
    });
  });

  it("rejects low risk scores", () => {
    assert.deepEqual(
      evaluateRecaptchaSiteVerify({ success: true, score: 0.1, action: "signup" }, opts),
      { ok: false, reason: "low_score" },
    );
  });

  it("accepts v3 tokens at or above the threshold with the signup action", () => {
    assert.deepEqual(
      evaluateRecaptchaSiteVerify({ success: true, score: 0.5, action: "signup" }, opts),
      { ok: true },
    );
    assert.deepEqual(
      evaluateRecaptchaSiteVerify({ success: true, score: 0.9, action: "signup" }, opts),
      { ok: true },
    );
  });

  it("rejects a token minted for a different action", () => {
    assert.deepEqual(
      evaluateRecaptchaSiteVerify({ success: true, score: 0.9, action: "login" }, opts),
      { ok: false, reason: "action" },
    );
  });

  it("accepts v2-style success with no score or action", () => {
    assert.deepEqual(evaluateRecaptchaSiteVerify({ success: true }, opts), { ok: true });
  });
});

describe("verifyRecaptchaToken", () => {
  it("rejects an empty token without calling Google", async () => {
    let called = false;
    const result = await verifyRecaptchaToken({
      token: "  ",
      ip: "1.1.1.1",
      secret: "secret",
      minScore: 0.5,
      expectedAction: "signup",
      fetchImpl: async () => {
        called = true;
        return new Response("{}");
      },
    });
    assert.equal(called, false);
    assert.deepEqual(result, { ok: false, reason: "invalid" });
  });

  it("does not treat a low Google score as a successful signup", async () => {
    const result = await verifyRecaptchaToken({
      token: "bot-token",
      ip: "1.1.1.1",
      secret: "secret",
      minScore: 0.5,
      expectedAction: "signup",
      fetchImpl: async () =>
        Response.json({ success: true, score: 0.2, action: "signup" }),
    });
    assert.deepEqual(result, { ok: false, reason: "low_score" });
  });

  it("accepts a valid high-score signup token", async () => {
    const result = await verifyRecaptchaToken({
      token: "ok-token",
      ip: "1.1.1.1",
      secret: "secret",
      minScore: 0.5,
      expectedAction: "signup",
      fetchImpl: async () =>
        Response.json({ success: true, score: 0.86, action: "signup" }),
    });
    assert.deepEqual(result, { ok: true });
  });
});
