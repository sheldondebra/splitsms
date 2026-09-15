export function isNeonDatabaseUrl(connectionString: string) {
  return connectionString.includes("neon.tech");
}

function isIpv4Host(hostname: string) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}

/**
 * Prefer a Neon pooled URL when both Neon and a leftover Cloud SQL URL are present.
 * Vercel’s Neon integration sets POSTGRES_URL / POSTGRES_PRISMA_URL; the app reads DATABASE_URL.
 */
export function resolveDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const candidates = [
    env.DATABASE_URL,
    env.POSTGRES_PRISMA_URL,
    env.POSTGRES_URL,
    env.DATABASE_URL_UNPOOLED,
    env.POSTGRES_URL_NON_POOLING,
  ].filter((value): value is string => Boolean(value?.trim()));

  if (candidates.length === 0) {
    throw new Error("DATABASE_URL is not set");
  }

  return candidates.find(isNeonDatabaseUrl) ?? candidates[0];
}

/**
 * Neon URLs from the console sometimes include channel_binding, which breaks some Node/pg builds.
 *
 * node-postgres 8.21+ treats sslmode=require as verify-full. Neon and Cloud SQL public-IP
 * certs are not in Node's trust store, so verification can fail. Opt into libpq semantics
 * so require means encrypt-without-CA-verify.
 */
export function normalizeDatabaseUrl(raw: string): string {
  try {
    const url = new URL(raw);
    url.searchParams.delete("channel_binding");
    if (!url.searchParams.has("sslmode")) {
      url.searchParams.set("sslmode", "require");
    }
    const sslmode = url.searchParams.get("sslmode");
    const socketHost = url.searchParams.get("host");
    const viaCloudSqlSocket = Boolean(socketHost?.startsWith("/cloudsql/"));
    const neonOrIp = isNeonDatabaseUrl(raw) || isIpv4Host(url.hostname);
    if (
      !viaCloudSqlSocket &&
      neonOrIp &&
      !url.searchParams.has("uselibpqcompat") &&
      (sslmode === "require" || sslmode === "prefer" || sslmode === "verify-ca")
    ) {
      url.searchParams.set("uselibpqcompat", "true");
    }
    return url.toString();
  } catch {
    return raw;
  }
}
