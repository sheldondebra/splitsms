import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isDarkFormBackground, resolveFormBackground } from "../../lib/smart-forms/theme";

describe("form background", () => {
  it("treats navy washes as dark and empty as the default paper grey", () => {
    assert.equal(isDarkFormBackground("#151560"), true);
    assert.equal(isDarkFormBackground("#f4f4f5"), false);
    assert.equal(resolveFormBackground(undefined), "#f4f4f5");
  });
});
