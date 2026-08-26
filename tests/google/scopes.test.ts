import assert from "node:assert/strict";
import test from "node:test";
import {
  hasScopes,
  mergeScopes,
  missingScopes,
  parseScopeString,
  resolveGrantedScopes,
} from "../../lib/google/connection-utils";
import { GOOGLE_BASE_SCOPES, GOOGLE_SCOPES } from "../../lib/google/scopes";

test("hasScopes requires every scope", () => {
  assert.equal(
    hasScopes([...GOOGLE_BASE_SCOPES], [GOOGLE_SCOPES.email, GOOGLE_SCOPES.profile]),
    true,
  );
  assert.equal(hasScopes([...GOOGLE_BASE_SCOPES], [GOOGLE_SCOPES.contacts]), false);
});

test("contacts write scope satisfies contacts.readonly for import", () => {
  assert.equal(
    hasScopes([GOOGLE_SCOPES.contacts], [GOOGLE_SCOPES.contactsReadonly]),
    true,
  );
  assert.equal(
    hasScopes([GOOGLE_SCOPES.contactsReadonly], [GOOGLE_SCOPES.contacts]),
    false,
  );
  assert.deepEqual(
    missingScopes([GOOGLE_SCOPES.contacts], [GOOGLE_SCOPES.contactsReadonly]),
    [],
  );
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

test("parseScopeString treats plus signs as spaces from query strings", () => {
  assert.deepEqual(
    parseScopeString(
      "email+https://www.googleapis.com/auth/drive.readonly+openid",
    ),
    [
      "email",
      "https://www.googleapis.com/auth/drive.readonly",
      "openid",
    ],
  );
});

test("resolveGrantedScopes trusts token scopes and does not invent requested ones", () => {
  const token =
    "openid email profile https://www.googleapis.com/auth/contacts.readonly";
  assert.deepEqual(
    resolveGrantedScopes(
      token,
      [
        GOOGLE_SCOPES.contactsReadonly,
        GOOGLE_SCOPES.spreadsheets,
        GOOGLE_SCOPES.driveReadonly,
      ],
      [GOOGLE_SCOPES.contactsReadonly],
    ),
    parseScopeString(token),
  );
});

test("resolveGrantedScopes falls back to previous+requested when token omits scope", () => {
  assert.deepEqual(
    resolveGrantedScopes(undefined, [GOOGLE_SCOPES.spreadsheets], [
      GOOGLE_SCOPES.contactsReadonly,
    ]),
    mergeScopes([GOOGLE_SCOPES.contactsReadonly], [GOOGLE_SCOPES.spreadsheets]),
  );
});