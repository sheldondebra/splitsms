export function isNeonDatabaseUrl(connectionString: string) {
  return connectionString.includes("neon.tech");
}

export function isSupabaseDatabaseUrl(connectionString: string) {
  return (
    connectionString.includes("supabase.co") ||
    connectionString.includes("supabase.com")
  );
}

export type DatabaseProvider = "supabase" | "neon" | "other";

export type DatabaseConnectionMeta = {
  provider: DatabaseProvider;
  host: string | null;
  port: number | null;
  database: string | null;
  pooled: boolean;
  poolerMode: "transaction" | "session" | "direct" | "unknown";
  region: string | null;
  projectRef: string | null;
  dashboardUrl: string | null;
  sslMode: string | null;
  /** Env var name that supplied the active URL (safe label only). */
  sourceEnv: string | null;
};

/** Safe connection metadata for the admin UI — never includes credentials. */
export function describeDatabaseConnection(
  connectionString: string,
  sourceEnv: string | null = null,
): DatabaseConnectionMeta {
  let host: string | null = null;
  let port: number | null = null;
  let database: string | null = null;
  let username: string | null = null;
  let pooled = false;
  let poolerMode: DatabaseConnectionMeta["poolerMode"] = "unknown";
  let region: string | null = null;
  let projectRef: string | null = null;
  let sslMode: string | null = null;

  try {
    const url = new URL(connectionString);
    host = url.hostname || null;
    port = url.port ? Number(url.port) : 5432;
    database = url.pathname.replace(/^\//, "") || null;
    username = decodeURIComponent(url.username || "") || null;
    sslMode = url.searchParams.get("sslmode");
    const pgbouncer = url.searchParams.get("pgbouncer") === "true";
    pooled = pgbouncer || port === 6543;
    if (pgbouncer || port === 6543) poolerMode = "transaction";
    else if (host?.includes("pooler.supabase.com") && port === 5432) poolerMode = "session";
    else if (host && !host.includes("pooler")) poolerMode = "direct";
  } catch {
    // leave defaults
  }

  const provider: DatabaseProvider = isSupabaseDatabaseUrl(connectionString)
    ? "supabase"
    : isNeonDatabaseUrl(connectionString)
      ? "neon"
      : "other";

  if (provider === "supabase") {
    const fromUser = username?.match(/^postgres\.([a-z0-9]+)$/i)?.[1];
    const fromHost = host?.match(/^db\.([a-z0-9]+)\.supabase\.co$/i)?.[1];
    projectRef = fromUser ?? fromHost ?? null;
    region =
      host?.match(/aws-\d+-([a-z0-9-]+)\.pooler\.supabase\.com/i)?.[1] ??
      host?.match(/\.([a-z0-9-]+)\.supabase\.co$/i)?.[1] ??
      null;
  }

  if (provider === "neon" && host) {
    region = host.match(/\.([a-z0-9-]+)\.aws\.neon\.tech$/i)?.[1] ?? null;
  }

  return {
    provider,
    host,
    port,
    database,
    pooled,
    poolerMode,
    region,
    projectRef,
    dashboardUrl:
      provider === "supabase" && projectRef
        ? `https://supabase.com/dashboard/project/${projectRef}`
        : null,
    sslMode,
    sourceEnv,
  };
}

/**
 * Resolve which env key provided the active URL (for admin diagnostics).
 */
export function resolveDatabaseUrlSource(
  env: Record<string, string | undefined> = process.env,
): { url: string; sourceEnv: string } {
  const named: Array<{ key: string; value: string | undefined }> = [
    { key: "DATABASE_URL", value: env.DATABASE_URL },
    { key: "POSTGRES_PRISMA_URL", value: env.POSTGRES_PRISMA_URL },
    { key: "POSTGRES_URL", value: env.POSTGRES_URL },
    { key: "DATABASE_URL_UNPOOLED", value: env.DATABASE_URL_UNPOOLED },
    { key: "POSTGRES_URL_NON_POOLING", value: env.POSTGRES_URL_NON_POOLING },
    { key: "DIRECT_URL", value: env.DIRECT_URL },
  ];

  const candidates = named
    .map(({ key, value }) => ({ key, value: value?.trim() }))
    .filter((entry): entry is { key: string; value: string } => Boolean(entry.value));

  if (candidates.length === 0) {
    throw new Error("DATABASE_URL is not set");
  }

  const databaseUrl = env.DATABASE_URL?.trim();
  if (databaseUrl && !isLegacyCloudSqlUrl(databaseUrl)) {
    return { url: databaseUrl, sourceEnv: "DATABASE_URL" };
  }

  const neon = candidates.find((entry) => isNeonDatabaseUrl(entry.value));
  if (neon) return { url: neon.value, sourceEnv: neon.key };

  const supabase = candidates.find((entry) => isSupabaseDatabaseUrl(entry.value));
  if (supabase) return { url: supabase.value, sourceEnv: supabase.key };

  return { url: candidates[0]!.value, sourceEnv: candidates[0]!.key };
}

function isIpv4Host(hostname: string) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}

function isLegacyCloudSqlUrl(connectionString: string) {
  try {
    const url = new URL(connectionString);
    return isIpv4Host(url.hostname) || Boolean(url.searchParams.get("host")?.startsWith("/cloudsql/"));
  } catch {
    return false;
  }
}

/**
 * Resolve the live Postgres URL.
 *
 * Priority:
 * 1. Explicit DATABASE_URL when it is not a leftover Cloud SQL IP
 *    (so Supabase / intentional Neon DATABASE_URL always wins)
 * 2. Neon pooled URLs from Vercel’s Neon integration when DATABASE_URL is still Cloud SQL
 * 3. First available candidate
 */
export function resolveDatabaseUrl(
  env: Record<string, string | undefined> = process.env,
): string {
  return resolveDatabaseUrlSource(env).url;
}

/**
 * Neon/Supabase URLs sometimes include channel_binding, which breaks some Node/pg builds.
 *
 * node-postgres 8.21+ treats sslmode=require as verify-full. Managed Postgres public-IP
 * certs are not always in Node's trust store, so verification can fail. Opt into libpq
 * semantics so require means encrypt-without-CA-verify for Neon / Supabase / raw IPs.
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
    const managedOrIp =
      isNeonDatabaseUrl(raw) ||
      isSupabaseDatabaseUrl(raw) ||
      isIpv4Host(url.hostname);
    if (
      !viaCloudSqlSocket &&
      managedOrIp &&
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
