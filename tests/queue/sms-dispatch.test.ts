import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldAwaitSmsDispatch } from "../../lib/queue/enqueue-sms";
import {
  SMS_BATCH_CONCURRENCY,
  SMS_CRON_BATCH_LIMIT,
  SMS_DRAIN_INTERVAL_MS,
  SMS_DRAIN_MAX_ROUNDS,
  SMS_FAST_AWAIT_LIMIT,
  SMS_INLINE_CONCURRENCY,
} from "../../lib/queue/sms-dispatch-config";

describe("SMS dispatch speed", () => {
  it("awaits OTP and small campaigns in the request", () => {
    const jobs = Array.from({ length: 50 }, (_, i) => ({
      messageId: `m${i}`,
      countryCode: "GH",
    }));
    assert.equal(shouldAwaitSmsDispatch(jobs), true);
    assert.equal(shouldAwaitSmsDispatch(jobs.slice(0, 1)), true);
  });

  it("defers large non-critical campaigns so the API stays snappy", () => {
    const jobs = Array.from({ length: 51 }, (_, i) => ({
      messageId: `m${i}`,
      countryCode: "GH",
      priority: "MEDIUM" as const,
    }));
    assert.equal(shouldAwaitSmsDispatch(jobs), false);
  });

  it("still awaits large critical batches", () => {
    const jobs = Array.from({ length: 80 }, (_, i) => ({
      messageId: `m${i}`,
      countryCode: "GH",
      priority: "CRITICAL" as const,
    }));
    assert.equal(shouldAwaitSmsDispatch(jobs), true);
  });

  it("keeps cron drain aggressive enough for minute-level throughput", () => {
    assert.ok(SMS_FAST_AWAIT_LIMIT >= 50);
    assert.ok(SMS_CRON_BATCH_LIMIT >= 80);
    assert.ok(SMS_BATCH_CONCURRENCY >= 24);
    assert.ok(SMS_INLINE_CONCURRENCY >= 24);
    assert.equal(SMS_DRAIN_INTERVAL_MS, 0);
    assert.ok(SMS_DRAIN_MAX_ROUNDS >= 20);
  });
});
