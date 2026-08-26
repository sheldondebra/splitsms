import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveGeneralSettingsTab } from "../../lib/admin/general-settings-tab";

describe("resolveGeneralSettingsTab", () => {
  it("defaults to email", () => {
    assert.equal(resolveGeneralSettingsTab({}), "email");
  });

  it("honors an explicit tab query", () => {
    assert.equal(resolveGeneralSettingsTab({ tab: "slack" }), "slack");
    assert.equal(resolveGeneralSettingsTab({ tab: "alerts" }), "alerts");
  });

  it("opens the matching tab after save or test", () => {
    assert.equal(resolveGeneralSettingsTab({ saved: "alerts" }), "alerts");
    assert.equal(resolveGeneralSettingsTab({ saved: "slack" }), "slack");
    assert.equal(resolveGeneralSettingsTab({ test: "slack" }), "slack");
    assert.equal(resolveGeneralSettingsTab({ saved: "email" }), "email");
    assert.equal(resolveGeneralSettingsTab({ test: "connection" }), "email");
    assert.equal(resolveGeneralSettingsTab({ error: "not_configured" }), "email");
  });

  it("ignores unknown tab values", () => {
    assert.equal(resolveGeneralSettingsTab({ tab: "nope" }), "email");
  });
});
