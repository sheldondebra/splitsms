import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseNewsletterEmails,
  validateNewsletterSubmission,
} from "../../lib/newsletter/validate";
import {
  newsletterUnsubscribeToken,
  newsletterUnsubscribeTokenValid,
} from "../../lib/newsletter/unsubscribe-token";

describe("validateNewsletterSubmission", () => {
  it("accepts a normal email", () => {
    const result = validateNewsletterSubmission({
      email: " Ops@SplitSMS.com ",
      startedAt: String(Date.now() - 5_000),
    });
    assert.deepEqual(result, { ok: true, email: "ops@splitsms.com" });
  });

  it("rejects invalid email", () => {
    const result = validateNewsletterSubmission({ email: "not-an-email" });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, "invalid_email");
  });

  it("rejects a filled honeypot as a bot", () => {
    const result = validateNewsletterSubmission({
      email: "person@company.com",
      honeypot: "http://spam.test",
      startedAt: String(Date.now() - 5_000),
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, "honeypot");
  });

  it("rejects instant submits", () => {
    const result = validateNewsletterSubmission({
      email: "person@company.com",
      startedAt: String(Date.now()),
      now: Date.now(),
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, "too_fast");
  });

  it("rejects disposable inboxes", () => {
    const result = validateNewsletterSubmission({
      email: "a@mailinator.com",
      startedAt: String(Date.now() - 5_000),
      isDisposable: () => true,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, "disposable");
  });
});

describe("parseNewsletterEmails", () => {
  it("splits, trims, and de-dupes", () => {
    assert.deepEqual(
      parseNewsletterEmails("a@x.com, B@x.com\nc@y.com;a@x.com"),
      ["a@x.com", "b@x.com", "c@y.com"],
    );
  });

  it("splits space-separated addresses", () => {
    assert.deepEqual(parseNewsletterEmails("ops@company.com hello@agency.com"), [
      "ops@company.com",
      "hello@agency.com",
    ]);
  });
});

describe("newsletterUnsubscribeToken", () => {
  it("round-trips", () => {
    const token = newsletterUnsubscribeToken("ops@splitsms.com");
    assert.equal(newsletterUnsubscribeTokenValid("ops@splitsms.com", token), true);
    assert.equal(newsletterUnsubscribeTokenValid("other@splitsms.com", token), false);
  });
});
