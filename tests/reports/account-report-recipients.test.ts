import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAccountReportRecipient } from "../../lib/reports/send-member-account-report";

describe("isAccountReportRecipient", () => {
  it("requires a non-empty email", () => {
    assert.equal(isAccountReportRecipient({ email: null }), false);
    assert.equal(isAccountReportRecipient({ email: "   " }), false);
    assert.equal(isAccountReportRecipient({ email: "ama@example.com" }), true);
  });

  it("skips suspended and blocked accounts", () => {
    assert.equal(
      isAccountReportRecipient({ email: "ama@example.com", accountStatus: "SUSPENDED" }),
      false,
    );
    assert.equal(
      isAccountReportRecipient({ email: "ama@example.com", accountStatus: "BLOCKED" }),
      false,
    );
    assert.equal(
      isAccountReportRecipient({ email: "ama@example.com", accountStatus: "ACTIVE" }),
      true,
    );
  });
});
