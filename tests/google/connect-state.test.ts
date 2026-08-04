import assert from "node:assert/strict";
import test from "node:test";
import {
  signConnectState,
  verifyConnectState,
} from "../../lib/google/oauth-connect";

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
