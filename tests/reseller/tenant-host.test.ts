import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isCloudRunStagingHost,
  isPlatformHost,
  isVercelProjectHost,
  normalizeHost,
  shouldUseEnvSiteUrl,
} from "../../lib/reseller/tenant-host";

describe("platform hosts after Cloud Run → Vercel", () => {
  it("treats splitsms.com and www as the canonical platform", () => {
    assert.equal(normalizeHost("www.splitsms.com"), "splitsms.com");
    assert.equal(isPlatformHost("www.splitsms.com"), true);
    assert.equal(isPlatformHost("splitsms.com"), true);
  });

  it("treats Vercel project aliases as platform hosts", () => {
    assert.equal(isVercelProjectHost("splitsms.vercel.app"), true);
    assert.equal(isVercelProjectHost("splitsms-git-master-sheldondebras-projects.vercel.app"), true);
    assert.equal(isPlatformHost("splitsms.vercel.app"), true);
    assert.equal(isVercelProjectHost("other-app.vercel.app"), false);
  });

  it("still recognizes Cloud Run staging hosts", () => {
    assert.equal(isCloudRunStagingHost("splitsms-staging-123456.us-central1.run.app"), true);
    assert.equal(isPlatformHost("splitsms-staging-123456.us-central1.run.app"), true);
  });

  it("does not treat a customer domain as the platform", () => {
    assert.equal(isPlatformHost("sms.example.com"), false);
  });

  it("rejects Cloud Run URLs as the production canonical site", () => {
    assert.equal(
      shouldUseEnvSiteUrl("https://splitsms-staging-123.us-central1.run.app", {
        VERCEL_ENV: "production",
        NODE_ENV: "production",
      }),
      false,
    );
  });

  it("rejects Vercel aliases as the production canonical site", () => {
    assert.equal(
      shouldUseEnvSiteUrl("https://splitsms.vercel.app", {
        VERCEL_ENV: "production",
        NODE_ENV: "production",
      }),
      false,
    );
  });

  it("keeps www.splitsms.com as the production canonical site", () => {
    assert.equal(
      shouldUseEnvSiteUrl("https://www.splitsms.com", {
        VERCEL_ENV: "production",
        NODE_ENV: "production",
      }),
      true,
    );
  });
});
