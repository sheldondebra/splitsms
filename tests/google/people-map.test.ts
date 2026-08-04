import assert from "node:assert/strict";
import test from "node:test";
import { mapGooglePersonToContact } from "../../lib/google/people";

test("mapGooglePersonToContact prefers canonical phone and skips phoneless", () => {
  const mapped = mapGooglePersonToContact({
    resourceName: "people/c1",
    names: [{ displayName: "Ada Lovelace" }],
    emailAddresses: [{ value: "ada@example.com" }],
    phoneNumbers: [{ value: "0244123456", canonicalForm: "+233244123456" }],
  });
  assert.equal(mapped?.phone, "+233244123456");
  assert.equal(mapped?.name, "Ada Lovelace");
  assert.equal(mapped?.email, "ada@example.com");

  assert.equal(
    mapGooglePersonToContact({
      resourceName: "people/c2",
      names: [{ displayName: "No Phone" }],
    }),
    null,
  );
});
