import { PrismaPg } from "@prisma/adapter-pg";
import { Pool, type PoolClient } from "pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  pool: Pool;
  /** Bumped when the schema changes so dev hot-reload picks up new fields/models */
  prismaBuildId?: string;
};

/** Increment when Prisma schema changes require a fresh client in dev */
const PRISMA_CLIENT_BUILD_ID = "email-marketing-image-sidecar-2026-08-23";

const NEON_WAKE_DELAYS_MS = [500, 1500, 3000, 5000];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isNeonUrl(connectionString: string) {
  return connectionString.includes("neon.tech");
}

function isIpv4Host(hostname: string) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}

/**
 * Neon URLs from the console sometimes include channel_binding, which breaks some Node/pg builds.
 *
 * node-postgres 8.21+ treats sslmode=require as verify-full. Cloud SQL public-IP certs are not
 * in Node's trust store, so verification fails. Opt into libpq semantics for IP hosts so
 * require means encrypt-without-CA-verify (matches DEPLOY.md local Cloud SQL setup).
 */
function normalizeDatabaseUrl(raw: string): string {
  try {
    const url = new URL(raw);
    url.searchParams.delete("channel_binding");
    if (!url.searchParams.has("sslmode")) {
      url.searchParams.set("sslmode", "require");
    }
    const sslmode = url.searchParams.get("sslmode");
    const socketHost = url.searchParams.get("host");
    const viaCloudSqlSocket = Boolean(socketHost?.startsWith("/cloudsql/"));
    if (
      !viaCloudSqlSocket &&
      isIpv4Host(url.hostname) &&
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

function isRetriableDbError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes("Can't reach database server") ||
    message.includes("Connection terminated") ||
    message.includes("connection timeout") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ECONNRESET") ||
    message.includes("ENOTFOUND") ||
    message.includes("ETIMEDOUT")
  );
}

function createPool(connectionString: string): Pool {
  const normalized = normalizeDatabaseUrl(connectionString);
  const neon = isNeonUrl(normalized);

  const pool = new Pool({
    connectionString: normalized,
    max: neon ? 5 : 10,
    connectionTimeoutMillis: neon ? 25_000 : 10_000,
    idleTimeoutMillis: 20_000,
    allowExitOnIdle: true,
    ...(neon ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  const baseConnect = pool.connect.bind(pool) as {
    (): Promise<PoolClient>;
    (callback: (err: Error | undefined, client: PoolClient | undefined, done: (release?: unknown) => void) => void): void;
  };

  pool.connect = ((...args: unknown[]) => {
    if (typeof args[0] === "function") {
      return baseConnect(args[0] as Parameters<typeof baseConnect>[0]);
    }

    const connectOnce = () => baseConnect() as Promise<PoolClient>;
    if (!neon) return connectOnce();

    return (async () => {
      let lastError: unknown;
      const attempts = NEON_WAKE_DELAYS_MS.length + 1;
      for (let i = 0; i < attempts; i++) {
        try {
          return await connectOnce();
        } catch (err) {
          lastError = err;
          if (!isRetriableDbError(err) || i >= attempts - 1) throw err;
          await sleep(NEON_WAKE_DELAYS_MS[i] ?? 5000);
        }
      }
      throw lastError;
    })();
  }) as typeof pool.connect;

  pool.on("error", (err) => {
    console.error("[db] Pool client error:", err.message);
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = undefined as unknown as PrismaClient;
    }
  });

  return pool;
}

function resetPrismaClient() {
  if (process.env.NODE_ENV === "production") return;
  void globalForPrisma.pool?.end().catch(() => undefined);
  globalForPrisma.pool = undefined as unknown as Pool;
  globalForPrisma.prisma = undefined as unknown as PrismaClient;
  globalForPrisma.prismaBuildId = undefined;
}

function createPrisma() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const pool = globalForPrisma.pool ?? createPool(connectionString);
  if (!globalForPrisma.pool) globalForPrisma.pool = pool;
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

/** Dev hot-reload can keep an old Prisma client missing newer models — recreate if stale */
const REQUIRED_MODELS = [
  "authAttempt",
  "invoice",
  "enterpriseAccount",
  "apiLog",
  "memberAccount",
  "senderIdProviderRegistration",
  "smsRoutingLog",
  "connectCustomer",
  "supportTicketReply",
  "resellerPaymentSettings",
  "resellerPayoutRequest",
  "googleConnection",
  "googleFormSmsAutomation",
  "googleFormSmsSend",
  "smartFormEmailAutomation",
  "emailMarketingTemplate",
  "emailMarketingImage",
] as const;

function clientHasRequiredModels(client: PrismaClient): boolean {
  const c = client as unknown as Record<string, unknown>;
  return REQUIRED_MODELS.every((key) => c[key] != null);
}

function getPrisma(): PrismaClient {
  const cached = globalForPrisma.prisma;
  const buildId = globalForPrisma.prismaBuildId;
  if (cached && clientHasRequiredModels(cached) && buildId === PRISMA_CLIENT_BUILD_ID) {
    return cached;
  }
  // Drop the stale singleton + pool so connection options (e.g. SSL) are rebuilt.
  if (cached) {
    void (cached as { $disconnect?: () => Promise<void> }).$disconnect?.().catch(() => undefined);
  }
  if (buildId !== PRISMA_CLIENT_BUILD_ID && process.env.NODE_ENV !== "production") {
    void globalForPrisma.pool?.end().catch(() => undefined);
    globalForPrisma.pool = undefined as unknown as Pool;
  }
  const client = createPrisma();
  if (!clientHasRequiredModels(client)) {
    throw new Error(
      "[db] Prisma client is missing required models (e.g. resellerPaymentSettings). " +
        "Restart the Next.js dev server after running `npx prisma generate`.",
    );
  }
  globalForPrisma.prisma = client;
  globalForPrisma.prismaBuildId = PRISMA_CLIENT_BUILD_ID;
  return client;
}

/** Wake Neon compute on server start (cold databases can take a few seconds). */
export async function warmDatabaseConnection(retries = 4) {
  for (let i = 0; i < retries; i++) {
    try {
      await getPrisma().$queryRaw`SELECT 1`;
      return;
    } catch (err) {
      if (!isRetriableDbError(err) || i >= retries - 1) throw err;
      resetPrismaClient();
      await sleep(1500 * (i + 1));
    }
  }
}

/**
 * Always resolve through getPrisma(). A one-shot `export const prisma = getPrisma()`
 * freezes a stale client across Next.js HMR after `prisma generate` adds models.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
