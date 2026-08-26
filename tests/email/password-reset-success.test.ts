import assert from "node:assert/strict";
import test from "node:test";
import { config } from "dotenv";
import { passwordResetSuccessEmailContent } from "../../lib/email/templates";

config({ path: ".env" });

test("builds a professional password-change security notice", async () => {
  const supportUrl = "https://www.splitsms.com/support";
  const content = await passwordResetSuccessEmailContent({
    memberName: "Nana Asiama",
    changedAt: new Date("2026-07-31T20:15:00.000Z"),
    supportUrl,
  });

  assert.match(content.subject, /password.*changed/i);
  assert.match(content.text, /successfully changed/i);
  assert.match(content.text, /didn't make this change/i);
  assert.match(content.html, /Your password was changed/);
  assert.match(content.html, /www\.splitsms\.com/);
  assert.match(content.html, new RegExp(supportUrl.replaceAll("/", "\\/")));
  assert.doesNotMatch(
    `${content.subject}${content.text}${content.html}`,
    /ExistingPassword!42/,
  );
});
