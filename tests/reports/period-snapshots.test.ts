import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mergeDayCounts,
  reportSnapshotDetailHref,
  reportSnapshotWindows,
} from "../../lib/reports/period";

describe("reportSnapshotWindows", () => {
  it("uses start of today, 7 days ago, and 30 days ago", () => {
    const now = new Date("2026-08-17T21:20:00");
    const windows = reportSnapshotWindows(now);

    assert.equal(windows.daily.toISOString(), new Date("2026-08-17T00:00:00").toISOString());
    assert.equal(windows.weekly.toISOString(), new Date("2026-08-10T00:00:00").toISOString());
    assert.equal(windows.monthly.toISOString(), new Date("2026-07-18T00:00:00").toISOString());
  });
});

describe("reportSnapshotDetailHref", () => {
  it("sends daily and weekly snapshots to the 7-day detail report", () => {
    assert.equal(
      reportSnapshotDetailHref("delivery", "daily"),
      "/admin/reports/delivery?days=7",
    );
    assert.equal(
      reportSnapshotDetailHref("members", "weekly"),
      "/admin/reports/members?days=7",
    );
    assert.equal(
      reportSnapshotDetailHref("transactions", "weekly"),
      "/admin/reports/transactions?days=7",
    );
  });

  it("sends monthly snapshots to the 30-day detail report", () => {
    assert.equal(
      reportSnapshotDetailHref("delivery", "monthly"),
      "/admin/reports/delivery?days=30",
    );
    assert.equal(
      reportSnapshotDetailHref("members", "monthly"),
      "/admin/reports/members?days=30",
    );
    assert.equal(
      reportSnapshotDetailHref("transactions", "monthly"),
      "/admin/reports/transactions?days=30",
    );
  });
});

describe("mergeDayCounts", () => {
  it("fills missing days with zero and matches SQL day buckets to local labels", () => {
    const days = [
      { label: "15 Aug", start: new Date(2026, 7, 15) },
      { label: "16 Aug", start: new Date(2026, 7, 16) },
      { label: "17 Aug", start: new Date(2026, 7, 17) },
    ];

    const merged = mergeDayCounts(days, [
      { day: "2026-08-15", count: 1200 },
      { day: "2026-08-17", count: 40 },
    ]);

    assert.deepEqual(merged, [
      { date: "15 Aug", value: 1200 },
      { date: "16 Aug", value: 0 },
      { date: "17 Aug", value: 40 },
    ]);
  });
});
