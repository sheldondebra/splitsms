import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword } from "../../lib/auth/password";
import { isCurrentPassword } from "../../lib/auth/password-policy";

test("identifies the current password", async () => {
  const currentHash = await hashPassword("ExistingPassword!42");

  assert.equal(
    await isCurrentPassword("ExistingPassword!42", currentHash),
    true,
  );
});

test("allows a password different from the current password", async () => {
  const currentHash = await hashPassword("ExistingPassword!42");

  assert.equal(
    await isCurrentPassword("DifferentPassword!84", currentHash),
    false,
  );
});
