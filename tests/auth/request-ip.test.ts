import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeClientIp,
  pickClientIpFromHeaders,
} from "../../lib/auth/client-ip";

describe("normalizeClientIp", () => {
  it("maps IPv6 loopback to 127.0.0.1", () => {
    assert.equal(normalizeClientIp("::1"), "127.0.0.1");
    assert.equal(normalizeClientIp("0:0:0:0:0:0:0:1"), "127.0.0.1");
  });

  it("unwraps IPv4-mapped IPv6", () => {
    assert.equal(normalizeClientIp("::ffff:203.0.113.10"), "203.0.113.10");
  });

  it("strips brackets and zone ids", () => {
    assert.equal(normalizeClientIp("[2001:db8::1]"), "2001:db8::1");
    assert.equal(normalizeClientIp("fe80::1%lo0"), "fe80::1");
  });
});

describe("pickClientIpFromHeaders", () => {
  it("prefers Cloudflare / Vercel headers over XFF", () => {
    const headers = new Map([
      ["x-forwarded-for", "203.0.113.1, 10.0.0.1"],
      ["cf-connecting-ip", "198.51.100.20"],
    ]);
    assert.equal(
      pickClientIpFromHeaders((name) => headers.get(name) ?? null),
      "198.51.100.20",
    );
  });

  it("takes the leftmost XFF hop and normalizes loopback", () => {
    const headers = new Map([["x-forwarded-for", "::1, 10.0.0.1"]]);
    assert.equal(
      pickClientIpFromHeaders((name) => headers.get(name) ?? null),
      "127.0.0.1",
    );
  });

  it("returns unknown when nothing is present", () => {
    assert.equal(pickClientIpFromHeaders(() => null), "unknown");
  });
});
