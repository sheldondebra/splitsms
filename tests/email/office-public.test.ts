import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toPublicEmailOffice, type EmailOfficeStored } from "../../lib/email/office-config";

const stored: EmailOfficeStored = {
  provider: "smtp",
  apiKey: "mj-key-secret",
  apiSecret: "mj-secret-value",
  resendApiKey: "re_live_secret",
  fromEmail: "info@splitsms.com",
  fromName: "SplitSMS",
  sandbox: false,
  smtpHost: "mail.splitsms.com",
  smtpPort: 465,
  smtpSecure: true,
  smtpUser: "info@splitsms.com",
  smtpPassword: "must-never-leave-server",
  headerImageUrl: "",
  headerImagePosition: "above",
};

describe("toPublicEmailOffice", () => {
  it("strips API keys and SMTP password from the admin payload", () => {
    const publicStored = toPublicEmailOffice(stored);
    assert.equal(publicStored.provider, "smtp");
    assert.equal(publicStored.fromEmail, "info@splitsms.com");
    assert.equal(publicStored.smtpHost, "mail.splitsms.com");
    assert.equal(publicStored.smtpPort, 465);
    assert.equal(publicStored.smtpUser, "info@splitsms.com");
    assert.equal(publicStored.hasSmtpPassword, true);
    assert.equal(publicStored.hasResendApiKey, true);
    assert.equal(publicStored.hasApiKey, true);
    assert.equal(publicStored.hasApiSecret, true);
    assert.equal("smtpPassword" in publicStored, false);
    assert.equal("apiKey" in publicStored, false);
    assert.equal("apiSecret" in publicStored, false);
    assert.equal("resendApiKey" in publicStored, false);
    assert.equal(JSON.stringify(publicStored).includes("must-never-leave-server"), false);
    assert.equal(JSON.stringify(publicStored).includes("re_live_secret"), false);
  });
});
