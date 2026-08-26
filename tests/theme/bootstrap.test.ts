import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { THEME_BOOTSTRAP_SCRIPT, THEME_COOKIE } from "../../lib/theme";

describe("theme bootstrap", () => {
  it("applies the cookie before paint without a server cookies() read", () => {
    assert.match(THEME_BOOTSTRAP_SCRIPT, new RegExp(THEME_COOKIE));
    assert.match(THEME_BOOTSTRAP_SCRIPT, /prefers-color-scheme/);
    assert.match(THEME_BOOTSTRAP_SCRIPT, /colorScheme/);
  });
});
