import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatAdminTopbarClock } from "../../components/admin/admin-topbar-clock";

describe("formatAdminTopbarClock", () => {
  it("includes date and ticking seconds", () => {
    const stamp = new Date(2026, 7, 17, 23, 39, 7);
    assert.equal(formatAdminTopbarClock(stamp), "Mon 17 Aug 2026 · 11:39:07 PM");
  });
});
