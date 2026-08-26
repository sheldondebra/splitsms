import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isNavActive } from "../../lib/navigation/dashboard-nav";
import { getMemberPageTitle } from "../../lib/navigation/member-page-title";

describe("isNavActive", () => {
  it("does not mark Google active when Google Forms SMS is the current page", () => {
    const path = "/dashboard/integrations/google/forms";
    assert.equal(isNavActive(path, "/dashboard/integrations/google/forms"), true);
    assert.equal(isNavActive(path, "/dashboard/integrations/google"), false);
  });

  it("marks Google active on the Google overview page only", () => {
    const path = "/dashboard/integrations/google";
    assert.equal(isNavActive(path, "/dashboard/integrations/google"), true);
    assert.equal(isNavActive(path, "/dashboard/integrations/google/forms"), false);
  });
});

describe("getMemberPageTitle", () => {
  it("uses Google Forms SMS, not Google, on the nested forms page", () => {
    assert.equal(getMemberPageTitle("/dashboard/integrations/google/forms"), "Google Forms SMS");
    assert.equal(getMemberPageTitle("/dashboard/integrations/google"), "Google");
  });
});
