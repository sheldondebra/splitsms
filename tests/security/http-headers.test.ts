import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CLICKJACK_HEADERS,
  CLICKJACK_PATHS,
  SECURITY_HEADERS,
} from "../../lib/security/http-headers";

describe("SECURITY_HEADERS", () => {
  it("sets nosniff, HSTS, and a tight referrer policy", () => {
    const map = Object.fromEntries(SECURITY_HEADERS.map((h) => [h.key, h.value]));
    assert.equal(map["X-Content-Type-Options"], "nosniff");
    assert.match(map["Strict-Transport-Security"] ?? "", /max-age=63072000/);
    assert.equal(map["Referrer-Policy"], "strict-origin-when-cross-origin");
    assert.equal(map["X-Frame-Options"], undefined);
  });

  it("does not apply clickjacking headers to public form embeds", () => {
    assert.equal(
      CLICKJACK_PATHS.some(
        (s) => s === "/f" || s.startsWith("/f/") || s.startsWith("/embed"),
      ),
      false,
    );
    const map = Object.fromEntries(CLICKJACK_HEADERS.map((h) => [h.key, h.value]));
    assert.equal(map["X-Frame-Options"], "DENY");
    assert.match(map["Content-Security-Policy"] ?? "", /frame-ancestors 'none'/);
  });
});
