import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { describeDatabaseConnection } from "../../lib/postgres-connection";

describe("describeDatabaseConnection", () => {
  it("parses Supabase transaction pooler metadata", () => {
    const meta = describeDatabaseConnection(
      "postgresql://postgres.fctjsvgcizrxerleqayd:secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require",
    );
    assert.equal(meta.provider, "supabase");
    assert.equal(meta.host, "aws-0-us-east-1.pooler.supabase.com");
    assert.equal(meta.port, 6543);
    assert.equal(meta.pooled, true);
    assert.equal(meta.poolerMode, "transaction");
    assert.equal(meta.region, "us-east-1");
    assert.equal(meta.projectRef, "fctjsvgcizrxerleqayd");
    assert.equal(meta.sslMode, "require");
    assert.equal(
      meta.dashboardUrl,
      "https://supabase.com/dashboard/project/fctjsvgcizrxerleqayd",
    );
  });

  it("parses Supabase direct host project ref", () => {
    const meta = describeDatabaseConnection(
      "postgresql://postgres:secret@db.abcdef123.supabase.co:5432/postgres?sslmode=require",
    );
    assert.equal(meta.provider, "supabase");
    assert.equal(meta.projectRef, "abcdef123");
    assert.equal(meta.poolerMode, "direct");
    assert.equal(meta.pooled, false);
  });

  it("never embeds credentials in host fields", () => {
    const meta = describeDatabaseConnection(
      "postgresql://postgres.abc:SUPER_SECRET@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
    );
    assert.equal(meta.host, "aws-0-eu-west-1.pooler.supabase.com");
    assert.doesNotMatch(JSON.stringify(meta), /SUPER_SECRET/);
  });
});
