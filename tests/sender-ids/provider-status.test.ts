import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractMnotifySenderStatusText,
  isMnotifyHoldStatus,
  mapMnotifyStatusToLocal,
  mapProviderStatusText,
} from "../../lib/sender-ids/provider-status";

describe("isMnotifyHoldStatus", () => {
  it("detects hold wording without matching generic pending notes", () => {
    assert.equal(isMnotifyHoldStatus("On Hold"), true);
    assert.equal(isMnotifyHoldStatus("Approved On Hold"), true);
    assert.equal(isMnotifyHoldStatus("under review"), true);
    assert.equal(isMnotifyHoldStatus("Awaiting SplitSMS approval"), false);
    assert.equal(isMnotifyHoldStatus("Approved"), false);
  });
});

describe("mapProviderStatusText", () => {
  it("keeps approved-on-hold as pending, not approved", () => {
    assert.equal(mapProviderStatusText("Approved On Hold"), "PENDING");
    assert.equal(mapProviderStatusText("On Hold"), "PENDING");
    assert.equal(mapProviderStatusText("Approved"), "APPROVED");
  });
});

describe("mapMnotifyStatusToLocal", () => {
  it("does not approve senders that are on hold", () => {
    assert.equal(mapMnotifyStatusToLocal("Approved On Hold"), "PENDING");
    assert.equal(mapMnotifyStatusToLocal("Approved"), "APPROVED");
  });
});

describe("extractMnotifySenderStatusText", () => {
  it("prefers hold text over a generic Approved summary", () => {
    assert.equal(
      extractMnotifySenderStatusText({
        status: "success",
        message: "This sender ID is currently on hold",
        summary: { status: "Approved" },
      }),
      "This sender ID is currently on hold",
    );
  });

  it("uses summary status when there is no hold", () => {
    assert.equal(
      extractMnotifySenderStatusText({
        status: "success",
        message: "Sender ID status retrieved",
        summary: { status: "Approved" },
      }),
      "Approved",
    );
  });
});
