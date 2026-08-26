import assert from "node:assert/strict";
import test from "node:test";
import {
  googleConnectCallbackUri,
  googleConnectResultUrl,
  signConnectState,
  verifyConnectState,
} from "../../lib/google/oauth-connect";
import { googleCallbackUri } from "../../lib/auth/google";

test("connect state round-trips and rejects wrong purpose payloads", async () => {
  process.env.SESSION_SECRET = "test-session-secret-for-google-connect-state";
  const token = await signConnectState({
    userId: "user_1",
    returnTo: "/dashboard/integrations/google",
    requestedScopes: ["openid", "email"],
    nonce: "nonce123",
  });
  const parsed = await verifyConnectState(token);
  assert.deepEqual(parsed, {
    userId: "user_1",
    returnTo: "/dashboard/integrations/google",
    requestedScopes: ["openid", "email"],
    nonce: "nonce123",
  });
});

test("connect OAuth uses the same Google redirect URI as Sign-In", () => {
  assert.equal(
    googleConnectCallbackUri("https://www.splitsms.com"),
    googleCallbackUri("https://www.splitsms.com"),
  );
  assert.equal(
    googleConnectCallbackUri("http://localhost:3000"),
    "http://localhost:3000/api/auth/google/callback",
  );
});

test("connect errors return to the page that started OAuth", () => {
  const url = googleConnectResultUrl(
    "https://www.splitsms.com",
    "/dashboard/integrations/google/forms",
    { error: "google_failed" },
  );
  assert.equal(
    url.pathname,
    "/dashboard/integrations/google/forms",
  );
  assert.equal(url.searchParams.get("error"), "google_failed");
});
