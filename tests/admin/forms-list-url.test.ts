import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildAdminFormsHref, parseFormsPage } from "../../lib/admin/forms-list-url";

describe("admin forms urls", () => {
  it("keeps filters and omits page 1", () => {
    assert.equal(parseFormsPage("2"), 2);
    assert.equal(buildAdminFormsHref({ q: "lead", page: 1 }), "/admin/forms?q=lead");
    assert.equal(
      buildAdminFormsHref({ q: "lead", status: "PUBLISHED", page: 3 }),
      "/admin/forms?q=lead&status=PUBLISHED&page=3",
    );
  });
});
