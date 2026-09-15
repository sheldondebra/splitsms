import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  defaultPlatformFeatureFlags,
  featureForPath,
  isFeatureEnabledIn,
  parsePlatformFeatureFlags,
} from "../../lib/platform/feature-catalog";

describe("parsePlatformFeatureFlags", () => {
  it("defaults every feature on", () => {
    const flags = parsePlatformFeatureFlags(null);
    assert.equal(flags.login, true);
    assert.equal(flags.sms, true);
    assert.equal(flags.google, true);
    assert.equal(flags.smart_forms, true);
  });

  it("honors stored off switches", () => {
    const flags = parsePlatformFeatureFlags({ login: false, paystack: false });
    assert.equal(flags.login, false);
    assert.equal(flags.paystack, false);
    assert.equal(flags.register, true);
  });
});

describe("isFeatureEnabledIn", () => {
  it("turns off Google children when the master switch is off", () => {
    const flags = defaultPlatformFeatureFlags();
    flags.google = false;
    assert.equal(isFeatureEnabledIn(flags, "google"), false);
    assert.equal(isFeatureEnabledIn(flags, "google_forms"), false);
    assert.equal(isFeatureEnabledIn(flags, "google_signin"), false);
  });

  it("keeps Paystack off when wallet top-up is off", () => {
    const flags = defaultPlatformFeatureFlags();
    flags.wallet_topup = false;
    assert.equal(isFeatureEnabledIn(flags, "paystack"), false);
    flags.wallet_topup = true;
    flags.paystack = false;
    assert.equal(isFeatureEnabledIn(flags, "paystack"), false);
  });

  it("turns off bulk SMS when SMS is off", () => {
    const flags = defaultPlatformFeatureFlags();
    flags.sms = false;
    assert.equal(isFeatureEnabledIn(flags, "bulk_sms"), false);
  });
});

describe("featureForPath", () => {
  it("maps dashboard routes to features", () => {
    assert.equal(featureForPath("/dashboard/send"), "sms");
    assert.equal(featureForPath("/dashboard/campaigns/new"), "bulk_sms");
    assert.equal(featureForPath("/dashboard/integrations/google/forms"), "google_forms");
    assert.equal(featureForPath("/dashboard/integrations/google"), "google");
    assert.equal(featureForPath("/dashboard/forms/abc/builder"), "smart_forms_builder");
    assert.equal(featureForPath("/dashboard/wallet"), null);
    assert.equal(featureForPath("/dashboard/sender-ids"), null);
    assert.equal(featureForPath("/dashboard/transactions"), "transactions");
  });
});
