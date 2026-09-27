import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isReminderCampaignName,
  reminderCampaignName,
  reminderTitleFromCampaignName,
  subtractDays,
} from "../../lib/reminders/types";

describe("reminder helpers", () => {
  it("builds and parses reminder campaign names", () => {
    const early = reminderCampaignName("Gold payment", "early");
    const due = reminderCampaignName("Gold payment", "due");
    assert.equal(early, "[Reminder] Gold payment · Early");
    assert.equal(due, "[Reminder] Gold payment · Due");
    assert.equal(isReminderCampaignName(early), true);
    assert.equal(reminderTitleFromCampaignName(early), "Gold payment");
    assert.equal(reminderTitleFromCampaignName(`${due} (recurring)`), "Gold payment");
  });

  it("subtracts calendar days for early reminders", () => {
    const due = new Date("2026-09-30T09:00:00");
    const early = subtractDays(due, 3);
    assert.equal(early.toISOString().slice(0, 10), "2026-09-27");
  });
});
