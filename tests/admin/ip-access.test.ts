import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evaluatePlatformIpAccess,
  isValidIpEntry,
  normalizeIpEntry,
  type PlatformIpAccessConfig,
} from "../../lib/admin/ip-access";

function config(
  partial: Partial<PlatformIpAccessConfig> = {},
): PlatformIpAccessConfig {
  return {
    blacklist: [],
    whitelist: [],
    whitelistEnabled: false,
    ...partial,
  };
}

describe("normalizeIpEntry / isValidIpEntry", () => {
  it("trims and accepts IPv4", () => {
    assert.equal(normalizeIpEntry("  203.0.113.10 "), "203.0.113.10");
    assert.equal(isValidIpEntry("203.0.113.10"), true);
    assert.equal(isValidIpEntry("203.0.113."), true);
    assert.equal(isValidIpEntry("unknown"), false);
    assert.equal(isValidIpEntry(""), false);
  });
});

describe("evaluatePlatformIpAccess", () => {
  it("allows when no lists are configured", () => {
    assert.deepEqual(evaluatePlatformIpAccess("203.0.113.10", config()), {
      allowed: true,
    });
  });

  it("blocks blacklisted IPs and prefixes", () => {
    const cfg = config({
      blacklist: [
        {
          ip: "203.0.113.10",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
        {
          ip: "198.51.100.",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
    const exact = evaluatePlatformIpAccess("203.0.113.10", cfg);
    assert.equal(exact.allowed, false);
    if (!exact.allowed) {
      assert.equal(exact.reason, "blacklisted");
      assert.equal(exact.matched, "203.0.113.10");
    }

    const prefix = evaluatePlatformIpAccess("198.51.100.44", cfg);
    assert.equal(prefix.allowed, false);
    if (!prefix.allowed) {
      assert.equal(prefix.matched, "198.51.100.");
    }

    assert.deepEqual(evaluatePlatformIpAccess("203.0.113.11", cfg), {
      allowed: true,
    });
  });

  it("enforces whitelist mode", () => {
    const cfg = config({
      whitelistEnabled: true,
      whitelist: [
        {
          ip: "203.0.113.10",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
    assert.deepEqual(evaluatePlatformIpAccess("203.0.113.10", cfg), {
      allowed: true,
    });
    const denied = evaluatePlatformIpAccess("198.51.100.1", cfg);
    assert.equal(denied.allowed, false);
    if (!denied.allowed) {
      assert.equal(denied.reason, "not_whitelisted");
    }
  });
});
