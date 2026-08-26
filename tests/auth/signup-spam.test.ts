import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolvePublicOtpPurpose,
  signupIdentityBlockReason,
} from "../../lib/auth/signup-spam";

describe("signupIdentityBlockReason", () => {
  it("rejects a number that is not a real phone", () => {
    assert.equal(
      signupIdentityBlockReason({ phone: "+23312", countryCode: "GH" }),
      "invalid_phone",
    );
    assert.equal(
      signupIdentityBlockReason({ phone: "not-a-phone", countryCode: "GH" }),
      "invalid_phone",
    );
  });

  it("accepts a valid Ghana mobile number", () => {
    assert.equal(
      signupIdentityBlockReason({ phone: "+233244123456", countryCode: "GH" }),
      null,
    );
  });

  it("rejects disposable / throwaway email domains", () => {
    assert.equal(
      signupIdentityBlockReason({
        phone: "+233244123456",
        countryCode: "GH",
        email: "bot@mailinator.com",
      }),
      "disposable_email",
    );
    assert.equal(
      signupIdentityBlockReason({
        phone: "+233244123456",
        countryCode: "GH",
        email: "x@guerrillamail.com",
      }),
      "disposable_email",
    );
    assert.equal(
      signupIdentityBlockReason({
        phone: "+233244123456",
        countryCode: "GH",
        email: "bot@yopmail.net",
      }),
      "disposable_email",
    );
  });

  it("allows a normal work email", () => {
    assert.equal(
      signupIdentityBlockReason({
        phone: "+233244123456",
        countryCode: "GH",
        email: "ops@splitsms.com",
      }),
      null,
    );
  });
});

describe("resolvePublicOtpPurpose", () => {
  it("does not treat missing purpose as signup", () => {
    assert.equal(resolvePublicOtpPurpose(undefined), "login");
    assert.equal(resolvePublicOtpPurpose(""), "login");
    assert.equal(resolvePublicOtpPurpose("signup"), "signup");
    assert.equal(resolvePublicOtpPurpose("login"), "login");
    assert.equal(resolvePublicOtpPurpose("reset"), "reset");
  });
});
