import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { signupCaptchaKind } from "../../lib/auth/recaptcha";
import { publicCaptchaConfig } from "../../lib/auth/signup-guard-shared";

describe("publicCaptchaConfig", () => {
  it("prefers reCAPTCHA when a runtime site key is present", () => {
    assert.deepEqual(
      publicCaptchaConfig({
        recaptchaSiteKey: " 6L-runtime-key ",
        turnstileSiteKey: "1x000",
      }),
      { provider: "recaptcha", siteKey: "6L-runtime-key" },
    );
  });

  it("falls back to Turnstile when reCAPTCHA is not configured", () => {
    assert.deepEqual(
      publicCaptchaConfig({
        recaptchaSiteKey: "  ",
        turnstileSiteKey: "1x00000000000000000000AA",
      }),
      { provider: "turnstile", siteKey: "1x00000000000000000000AA" },
    );
  });

  it("renders no widget when neither public key is set", () => {
    assert.deepEqual(publicCaptchaConfig({}), { provider: null, siteKey: null });
  });
});

describe("signupCaptchaKind", () => {
  it("only requires a reCAPTCHA token when both keys are present", () => {
    assert.equal(signupCaptchaKind("required", false), "recaptcha");
    assert.equal(signupCaptchaKind("required", true), "recaptcha");
  });

  it("does not require a token when captcha is off or misconfigured", () => {
    assert.equal(signupCaptchaKind("off", false), null);
    assert.equal(signupCaptchaKind("misconfigured", false), null);
  });

  it("uses Turnstile when reCAPTCHA is not required and Turnstile is enabled", () => {
    assert.equal(signupCaptchaKind("off", true), "turnstile");
    assert.equal(signupCaptchaKind("misconfigured", true), "turnstile");
  });
});
