import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { looksLikePhone, memberRelatedLabel, moneyBounds } from "../../lib/admin/global-search";

const member = {
  id: "cmr9kz9zl000004lex6fhbchu",
  fullName: "Hon. Tahiru Shiraz",
  email: "shirazabdulkadir1@gmail.com",
  phone: "+233551054077",
  accountNumber: 12,
  walletBalance: 42,
  smsCredits: 222,
  businessName: null,
};

describe("admin search match labels", () => {
  it("treats a decimal as an amount range", () => {
    assert.deepEqual(moneyBounds("GHS 137.60"), { gte: 137.6, lt: 137.605 });
    assert.deepEqual(moneyBounds("137.6"), { gte: 137.6, lt: 137.7 });
    assert.deepEqual(moneyBounds("18"), { gte: 18, lt: 19 });
    assert.equal(moneyBounds("shiraz"), null);
  });

  it("labels the field the query matched", () => {
    assert.equal(looksLikePhone("0551054077"), true);
    assert.equal(memberRelatedLabel("cmr9kz9zl", member), "Member ID");
    assert.equal(memberRelatedLabel("shirazabdulkadir1@gmail.com", member), "Email");
    assert.equal(memberRelatedLabel("551054077", member), "Phone");
    assert.equal(memberRelatedLabel("12", member), "Account no.");
    assert.equal(memberRelatedLabel("Tahiru", member), "Name");
    assert.equal(memberRelatedLabel("42", { ...member, accountNumber: null, smsCredits: 10 }), "Wallet");
    assert.equal(
      memberRelatedLabel("222", { ...member, accountNumber: null, walletBalance: 5 }),
      "SMS credits",
    );
  });
});
