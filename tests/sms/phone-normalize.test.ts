import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeOnePhone,
  normalizePhones,
  parseRecipientPhones,
} from "../../lib/sms/units";
import { validateRecipientPhone } from "../../lib/sms/phone-validation";
import { toMemberFacingFailureReason } from "../../lib/sms/friendly-failure";

describe("normalizeOnePhone", () => {
  it("maps Ghana trunk 0… to +233", () => {
    assert.equal(normalizeOnePhone("0558185288", "GH"), "+233558185288");
    assert.equal(normalizeOnePhone("0207544563", "GH"), "+233207544563");
  });

  it("keeps valid E.164", () => {
    assert.equal(normalizeOnePhone("+233558185288"), "+233558185288");
    assert.equal(normalizeOnePhone("233558185288"), "+233558185288");
  });

  it("parses bare Ghana national with default country", () => {
    const parsed = parseRecipientPhones("558185288", "GH");
    assert.deepEqual(parsed.valid, ["+233558185288"]);
  });

  it("rejects garbage", () => {
    assert.deepEqual(parseRecipientPhones("123", "GH").valid, []);
    assert.ok(parseRecipientPhones("not-a-phone", "GH").invalid.includes("not-a-phone"));
  });
});

describe("parseRecipientPhones", () => {
  it("separates valid and invalid", () => {
    const result = parseRecipientPhones("0558185288\nbad\n+233201234567", "GH");
    assert.ok(result.valid.includes("+233558185288"));
    assert.ok(result.valid.includes("+233201234567"));
    assert.ok(result.invalid.includes("bad"));
  });

  it("dedupes", () => {
    assert.deepEqual(normalizePhones("0558185288\n+233558185288", "GH"), [
      "+233558185288",
    ]);
  });
});

describe("validateRecipientPhone", () => {
  it("marks Ghana local as valid", () => {
    const check = validateRecipientPhone("0558185288", "GH");
    assert.equal(check.valid, true);
    assert.equal(check.normalized, "+233558185288");
  });

  it("marks short junk as invalid", () => {
    assert.equal(validateRecipientPhone("12345", "GH").valid, false);
  });
});

describe("toMemberFacingFailureReason", () => {
  it("explains unapproved sender id", () => {
    assert.match(
      toMemberFacingFailureReason("sender id is not registered or approved"),
      /Sender ID/i,
    );
  });

  it("explains invalid destination", () => {
    assert.match(
      toMemberFacingFailureReason("Invalid recipient number"),
      /Invalid phone/i,
    );
  });
});
