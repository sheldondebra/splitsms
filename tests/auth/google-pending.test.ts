import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveGoogleAccountAction,
  resolveGoogleOAuthOrigin,
} from "../../lib/auth/google";

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

test("oauth origin prefers NEXT_PUBLIC_APP_URL over Cloud Run bind address", () => {
  const prev = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = "https://www.splitsms.com";
  try {
    const request = new Request("https://0.0.0.0:8080/api/auth/google", {
      headers: { host: "0.0.0.0:8080" },
    });
    assert.equal(resolveGoogleOAuthOrigin(request), "https://www.splitsms.com");
  } finally {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = prev;
  }
});
