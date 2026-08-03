import assert from "node:assert/strict";
import test from "node:test";
import { resolveGoogleAccountAction } from "../../lib/auth/google";

test("prefers google id match for login", () => {
  assert.equal(
    resolveGoogleAccountAction({
      byGoogleId: { id: "g1" },
      byEmail: { id: "e1", googleId: null },
    }),
    "login_google",
  );
});

test("links email account when google id is free", () => {
  assert.equal(
    resolveGoogleAccountAction({
      byGoogleId: null,
      byEmail: { id: "e1", googleId: null },
    }),
    "link_email",
  );
});

test("requires phone for brand new google identity", () => {
  assert.equal(
    resolveGoogleAccountAction({
      byGoogleId: null,
      byEmail: null,
    }),
    "needs_phone",
  );
});

test("conflicts when email is already linked to another google id", () => {
  assert.equal(
    resolveGoogleAccountAction({
      byGoogleId: null,
      byEmail: { id: "e1", googleId: "other-google" },
    }),
    "conflict",
  );
});
