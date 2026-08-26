import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  dismissSmartFormsPopup,
  hasReachedScrollThreshold,
  isSmartFormsPopupDismissed,
  shouldOpenSmartFormsPopup,
  shouldShowSmartFormsPopup,
  SMART_FORMS_POPUP_STORAGE_KEY,
} from "../../lib/marketing/smart-forms-popup";

describe("shouldShowSmartFormsPopup", () => {
  it("shows on the homepage, blog, and other marketing pages", () => {
    for (const path of [
      "/",
      "/blog",
      "/blog/google-forms-sms-automation-splitsms",
      "/features",
      "/products",
      "/solutions",
      "/pricing",
      "/docs",
      "/company",
      "/support",
      "/integrations/wordpress",
      "/google",
      "/reseller-platform",
    ]) {
      assert.equal(shouldShowSmartFormsPopup(path), true, path);
    }
  });

  it("hides on the Smart Forms details page", () => {
    assert.equal(shouldShowSmartFormsPopup("/smart-forms"), false);
    assert.equal(shouldShowSmartFormsPopup("/smart-forms/"), false);
    assert.equal(shouldShowSmartFormsPopup("/smart-forms/templates"), false);
  });

  it("hides on app, auth, ads, and public form surfaces", () => {
    for (const path of [
      "/go",
      "/dashboard",
      "/dashboard/forms",
      "/admin",
      "/reseller",
      "/enterprise",
      "/developers",
      "/onboarding",
      "/login",
      "/signup",
      "/f/abc123",
      "/embed/forms/abc123",
      "/join/invite",
      "/api/health",
    ]) {
      assert.equal(shouldShowSmartFormsPopup(path), false, path);
    }
  });

  it("does not treat /google as the ads funnel", () => {
    assert.equal(shouldShowSmartFormsPopup("/google"), true);
  });
});

describe("hasReachedScrollThreshold", () => {
  it("opens after 25% of the scrollable page", () => {
    assert.equal(
      hasReachedScrollThreshold({
        scrollY: 249,
        viewportHeight: 800,
        documentHeight: 1800,
      }),
      false,
    );
    assert.equal(
      hasReachedScrollThreshold({
        scrollY: 250,
        viewportHeight: 800,
        documentHeight: 1800,
      }),
      true,
    );
  });

  it("treats a page that cannot scroll as already past the threshold", () => {
    assert.equal(
      hasReachedScrollThreshold({
        scrollY: 0,
        viewportHeight: 900,
        documentHeight: 800,
      }),
      true,
    );
  });
});

describe("session dismiss", () => {
  it("reads and writes the session storage flag", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    };

    assert.equal(isSmartFormsPopupDismissed(storage), false);
    dismissSmartFormsPopup(storage);
    assert.equal(store.get(SMART_FORMS_POPUP_STORAGE_KEY), "1");
    assert.equal(isSmartFormsPopupDismissed(storage), true);
  });
});

describe("shouldOpenSmartFormsPopup", () => {
  it("only opens when the page is eligible, not dismissed, and scrolled", () => {
    assert.equal(
      shouldOpenSmartFormsPopup({
        pathname: "/",
        dismissed: false,
        scrolled: true,
      }),
      true,
    );
    assert.equal(
      shouldOpenSmartFormsPopup({
        pathname: "/",
        dismissed: true,
        scrolled: true,
      }),
      false,
    );
    assert.equal(
      shouldOpenSmartFormsPopup({
        pathname: "/",
        dismissed: false,
        scrolled: false,
      }),
      false,
    );
    assert.equal(
      shouldOpenSmartFormsPopup({
        pathname: "/smart-forms",
        dismissed: false,
        scrolled: true,
      }),
      false,
    );
  });
});
