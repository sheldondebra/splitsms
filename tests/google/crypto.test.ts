import assert from "node:assert/strict";
import test from "node:test";
import { decryptToken, encryptToken } from "../../lib/google/crypto";

test("encryptToken round-trips", () => {
  process.env.SESSION_SECRET = "test-session-secret-for-google-crypto";
  delete process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
  const enc = encryptToken("refresh-token-abc");
  assert.match(enc, /^v1:/);
  assert.equal(decryptToken(enc), "refresh-token-abc");
});

test("decryptToken rejects tampered ciphertext", () => {
  process.env.SESSION_SECRET = "test-session-secret-for-google-crypto";
  delete process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
  const enc = encryptToken("secret");
  assert.throws(() => decryptToken(enc.slice(0, -2) + "xx"));
});
