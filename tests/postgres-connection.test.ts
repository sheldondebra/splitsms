import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeDatabaseUrl, resolveDatabaseUrl, describeDatabaseConnection } from "../lib/postgres-connection";

describe("resolveDatabaseUrl", () => {
  it("prefers a Neon URL when DATABASE_URL still points at Cloud SQL", () => {
    assert.match(
      resolveDatabaseUrl({
        DATABASE_URL: "postgresql://user:pass@34.123.250.81:5432/splitsms?sslmode=require",
        POSTGRES_URL:
          "postgresql://neondb_owner:pass@ep-foo-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require",
      }),
      /neon\.tech/,
    );
  });

  it("uses DATABASE_URL when it is already Neon", () => {
    const neon =
      "postgresql://neondb_owner:pass@ep-foo-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require";
    assert.equal(resolveDatabaseUrl({ DATABASE_URL: neon }), neon);
  });

  it("honors Supabase DATABASE_URL even when Neon POSTGRES_URL is still set", () => {
    const supabase =
      "postgresql://postgres:pass@db.example.supabase.co:5432/postgres?sslmode=require";
    assert.equal(
      resolveDatabaseUrl({
        DATABASE_URL: supabase,
        POSTGRES_URL:
          "postgresql://neondb_owner:pass@ep-foo-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require",
        POSTGRES_PRISMA_URL:
          "postgresql://neondb_owner:pass@ep-foo-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require",
      }),
      supabase,
    );
  });
});

describe("normalizeDatabaseUrl", () => {
  it("strips channel_binding and adds libpq compat for Neon", () => {
    const out = normalizeDatabaseUrl(
      "postgresql://neondb_owner:pass@ep-foo-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    );
    const url = new URL(out);
    assert.equal(url.searchParams.get("channel_binding"), null);
    assert.equal(url.searchParams.get("uselibpqcompat"), "true");
  });

  it("adds libpq compat for Supabase", () => {
    const out = normalizeDatabaseUrl(
      "postgresql://postgres:pass@db.example.supabase.co:5432/postgres?sslmode=require",
    );
    const url = new URL(out);
    assert.equal(url.searchParams.get("uselibpqcompat"), "true");
  });
});

describe("describeDatabaseConnection", () => {
  it("detects Supabase pooler region and project", () => {
    const meta = describeDatabaseConnection(
      "postgresql://postgres.myref:x@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
    );
    assert.equal(meta.provider, "supabase");
    assert.equal(meta.region, "us-east-1");
    assert.equal(meta.projectRef, "myref");
    assert.equal(meta.poolerMode, "transaction");
  });
});
