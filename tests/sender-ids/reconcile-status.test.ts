import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { derivePlatformStatusFromProviders } from "../../lib/sender-ids/reconcile-status";
import type { SenderIdProviderRegistration, SenderIdStatus } from "../../lib/generated/prisma/client";

function reg(
  provider: SenderIdProviderRegistration["provider"],
  status: SenderIdProviderRegistration["status"],
): SenderIdProviderRegistration {
  return {
    id: provider,
    senderId: "sid",
    provider,
    status,
    providerStatus: status,
    externalRef: null,
    error: null,
    submittedAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("derivePlatformStatusFromProviders", () => {
  it("auto-approves SplitSMS as soon as any carrier is approved", () => {
    const result = derivePlatformStatusFromProviders("PENDING", [
      reg("MNOTIFY", "APPROVED"),
      reg("TWILIO", "PENDING"),
    ]);
    assert.equal(result.status, "APPROVED");
    assert.match(result.reason ?? "", /provider/i);
  });

  it("approves even after a prior SplitSMS rejection once a carrier approves", () => {
    const result = derivePlatformStatusFromProviders("REJECTED", [reg("MNOTIFY", "APPROVED")]);
    assert.equal(result.status, "APPROVED");
  });

  it("stays pending until a carrier has approved", () => {
    const result = derivePlatformStatusFromProviders(
      "PENDING",
      [reg("MNOTIFY", "PENDING"), reg("TWILIO", "SKIPPED")],
      { submittedToProviders: true },
    );
    assert.equal(result.status, "PENDING");
  });

  it("does not treat unsubmitted platform review as carrier approval", () => {
    const result = derivePlatformStatusFromProviders("PENDING", [reg("MNOTIFY", "SKIPPED")], {
      submittedToProviders: false,
    });
    assert.equal(result.status, "PENDING" satisfies SenderIdStatus);
  });
});
