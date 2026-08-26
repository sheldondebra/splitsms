import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isCronAuthorized } from "../../lib/security/cron-auth";

function req(auth?: string) {
  return new Request("https://www.splitsms.com/api/cron/process-sms", {
    headers: auth ? { authorization: auth } : undefined,
  });
}

describe("isCronAuthorized", () => {
  it("allows unauthenticated cron in development when no secret is set", () => {
    assert.equal(
      isCronAuthorized(req(), { NODE_ENV: "development" }),
      true,
    );
  });

  it("rejects unauthenticated cron in production when no secret is set", () => {
    assert.equal(
      isCronAuthorized(req(), { NODE_ENV: "production" }),
      false,
    );
  });

  it("requires a matching Bearer token when CRON_SECRET is set", () => {
    const env = { NODE_ENV: "production", CRON_SECRET: "s3cret" };
    assert.equal(isCronAuthorized(req(), env), false);
    assert.equal(isCronAuthorized(req("Bearer nope"), env), false);
    assert.equal(isCronAuthorized(req("Bearer s3cret"), env), true);
  });
});
