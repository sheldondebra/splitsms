import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isSmartFormReportDue,
  reportFrequencyPeriod,
} from "../../lib/smart-forms/email-automation";

describe("smart form email reports", () => {
  it("maps frequency to the matching report period", () => {
    assert.equal(reportFrequencyPeriod("DAILY"), "today");
    assert.equal(reportFrequencyPeriod("WEEKLY"), "7d");
    assert.equal(reportFrequencyPeriod("MONTHLY"), "30d");
  });

  it("sends when never sent, then waits for the cadence", () => {
    const now = new Date("2026-08-20T12:00:00.000Z");
    assert.equal(isSmartFormReportDue("NONE", null, now), false);
    assert.equal(isSmartFormReportDue("DAILY", null, now), true);
    assert.equal(
      isSmartFormReportDue("DAILY", new Date("2026-08-20T08:00:00.000Z"), now),
      false,
    );
    assert.equal(
      isSmartFormReportDue("WEEKLY", new Date("2026-08-10T12:00:00.000Z"), now),
      true,
    );
  });
});
