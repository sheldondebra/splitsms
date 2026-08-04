import assert from "node:assert/strict";
import test from "node:test";
import {
  hasScopes,
  mergeScopes,
  missingScopes,
  parseScopeString,
} from "../../lib/google/connection-utils";
import { GOOGLE_BASE_SCOPES, GOOGLE_SCOPES } from "../../lib/google/scopes";

test("hasScopes requires every scope", () => {
  assert.equal(
    hasScopes([...GOOGLE_BASE_SCOPES], [GOOGLE_SCOPES.email, GOOGLE_SCOPES.profile]),
    true,
  );
  assert.equal(hasScopes([...GOOGLE_BASE_SCOPES], [GOOGLE_SCOPES.contacts]), false);
});

test("missingScopes lists only absent ones", () => {
  assert.deepEqual(
    missingScopes([...GOOGLE_BASE_SCOPES], [
      GOOGLE_SCOPES.email,
      GOOGLE_SCOPES.contactsReadonly,
    ]),
    [GOOGLE_SCOPES.contactsReadonly],
  );
});

test("mergeScopes dedupes and sorts", () => {
  assert.deepEqual(
    mergeScopes(["b", "a"], ["a", "c"]),
    ["a", "b", "c"],
  );
});

test("parseScopeString splits whitespace", () => {
  assert.deepEqual(parseScopeString("openid email  profile"), [
    "openid",
    "email",
    "profile",
  ]);
});
