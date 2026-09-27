import { prisma } from "@/lib/db";
import {
  describeDatabaseConnection,
  resolveDatabaseUrlSource,
  type DatabaseConnectionMeta,
} from "@/lib/postgres-connection";

export type { DatabaseConnectionMeta, DatabaseProvider } from "@/lib/postgres-connection";

export type PostgresHealthIssue = {
  severity: "warn" | "danger";
  code: string;
  message: string;
};

export type PostgresTableSize = {
  schema: string;
  name: string;
  sizeBytes: number;
  sizeLabel: string;
  approxRows: number | null;
};

export type PostgresHealth = {
  meta: DatabaseConnectionMeta;
  connected: boolean;
  latencyMs: number | null;
  error: string | null;
  version: string | null;
  versionShort: string | null;
  uptimeSeconds: number | null;
  uptimeLabel: string | null;
  sizeBytes: number | null;
  sizeLabel: string | null;
  maxConnections: number | null;
  connections: {
    total: number;
    active: number;
    idle: number;
    idleInTransaction: number;
    waiting: number;
    usagePct: number | null;
  } | null;
  cacheHitRatio: number | null;
  deadlocks: number | null;
  tempFiles: number | null;
  tempBytes: number | null;
  longestQuerySeconds: number | null;
  locksWaiting: number | null;
  currentUser: string | null;
  serverAddr: string | null;
  serverPort: number | null;
  timezone: string | null;
  sslInUse: boolean | null;
  statsResetAt: Date | null;
  tableCount: number | null;
  extensionCount: number | null;
  extensions: string[];
  topTables: PostgresTableSize[];
  issues: PostgresHealthIssue[];
  overall: "healthy" | "degraded" | "critical" | "down";
};

async function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(onTimeout), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  return h ? `${d}d ${h}h` : `${d}d`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function shortVersion(version: string): string {
  const match = version.match(/PostgreSQL\s+([\d.]+)/i);
  return match ? `PostgreSQL ${match[1]}` : version.slice(0, 48);
}

function evaluateIssues(input: {
  connected: boolean;
  latencyMs: number | null;
  connections: PostgresHealth["connections"];
  cacheHitRatio: number | null;
  locksWaiting: number | null;
  longestQuerySeconds: number | null;
  idleInTransaction: number;
}): PostgresHealthIssue[] {
  const issues: PostgresHealthIssue[] = [];
  if (!input.connected) {
    issues.push({
      severity: "danger",
      code: "db_down",
      message: "Database is unreachable",
    });
    return issues;
  }

  if (input.latencyMs != null) {
    if (input.latencyMs >= 2000) {
      issues.push({
        severity: "danger",
        code: "latency_high",
        message: `Query latency is ${input.latencyMs}ms (over 2s)`,
      });
    } else if (input.latencyMs >= 500) {
      issues.push({
        severity: "warn",
        code: "latency_elevated",
        message: `Query latency is ${input.latencyMs}ms (over 500ms)`,
      });
    }
  }

  if (input.connections?.usagePct != null) {
    if (input.connections.usagePct >= 90) {
      issues.push({
        severity: "danger",
        code: "connections_critical",
        message: `Connection usage at ${input.connections.usagePct}% — near max`,
      });
    } else if (input.connections.usagePct >= 70) {
      issues.push({
        severity: "warn",
        code: "connections_high",
        message: `Connection usage at ${input.connections.usagePct}%`,
      });
    }
  }

  if (input.idleInTransaction >= 5) {
    issues.push({
      severity: "warn",
      code: "idle_in_tx",
      message: `${input.idleInTransaction} connections idle in transaction`,
    });
  }

  if (input.cacheHitRatio != null) {
    if (input.cacheHitRatio < 0.9) {
      issues.push({
        severity: "danger",
        code: "cache_low",
        message: `Cache hit ratio ${(input.cacheHitRatio * 100).toFixed(1)}% (under 90%)`,
      });
    } else if (input.cacheHitRatio < 0.95) {
      issues.push({
        severity: "warn",
        code: "cache_soft",
        message: `Cache hit ratio ${(input.cacheHitRatio * 100).toFixed(1)}% (under 95%)`,
      });
    }
  }

  if ((input.locksWaiting ?? 0) > 0) {
    issues.push({
      severity: "warn",
      code: "locks_waiting",
      message: `${input.locksWaiting} lock${input.locksWaiting === 1 ? "" : "s"} waiting`,
    });
  }

  if ((input.longestQuerySeconds ?? 0) >= 60) {
    issues.push({
      severity: "danger",
      code: "long_query",
      message: `A query has been running for ${input.longestQuerySeconds}s`,
    });
  } else if ((input.longestQuerySeconds ?? 0) >= 30) {
    issues.push({
      severity: "warn",
      code: "long_query_soft",
      message: `A query has been running for ${input.longestQuerySeconds}s`,
    });
  }

  return issues;
}

function overallFromIssues(
  connected: boolean,
  issues: PostgresHealthIssue[],
): PostgresHealth["overall"] {
  if (!connected) return "down";
  if (issues.some((i) => i.severity === "danger")) return "critical";
  if (issues.some((i) => i.severity === "warn")) return "degraded";
  return "healthy";
}

function emptyExtras() {
  return {
    currentUser: null as string | null,
    serverAddr: null as string | null,
    serverPort: null as number | null,
    timezone: null as string | null,
    sslInUse: null as boolean | null,
    statsResetAt: null as Date | null,
    tableCount: null as number | null,
    extensionCount: null as number | null,
    extensions: [] as string[],
    topTables: [] as PostgresTableSize[],
  };
}

export async function getPostgresHealth(): Promise<PostgresHealth> {
  const resolved = resolveDatabaseUrlSource();
  const meta = describeDatabaseConnection(resolved.url, resolved.sourceEnv);
  const started = Date.now();
  const extras = emptyExtras();

  try {
    const ping = await withTimeout(prisma.$queryRaw`SELECT 1 AS ok`, 8_000, null);
    if (!ping) {
      return {
        meta,
        connected: false,
        latencyMs: null,
        error: "Timed out connecting to Postgres",
        version: null,
        versionShort: null,
        uptimeSeconds: null,
        uptimeLabel: null,
        sizeBytes: null,
        sizeLabel: null,
        maxConnections: null,
        connections: null,
        cacheHitRatio: null,
        deadlocks: null,
        tempFiles: null,
        tempBytes: null,
        longestQuerySeconds: null,
        locksWaiting: null,
        ...extras,
        issues: evaluateIssues({
          connected: false,
          latencyMs: null,
          connections: null,
          cacheHitRatio: null,
          locksWaiting: null,
          longestQuerySeconds: null,
          idleInTransaction: 0,
        }),
        overall: "down",
      };
    }

    const latencyMs = Date.now() - started;

    const [infoRows, connRows, cacheRows, lockRows, longRows, sessionRows, sslRows, extRows, tableRows] =
      await Promise.all([
        prisma.$queryRaw<
          {
            version: string;
            uptime_seconds: number;
            size_bytes: bigint;
            size_pretty: string;
            max_connections: string;
          }[]
        >`
        SELECT
          version() AS version,
          EXTRACT(EPOCH FROM (now() - pg_postmaster_start_time()))::int AS uptime_seconds,
          pg_database_size(current_database()) AS size_bytes,
          pg_size_pretty(pg_database_size(current_database())) AS size_pretty,
          current_setting('max_connections') AS max_connections
      `.catch(() => []),
        prisma.$queryRaw<
          {
            total: number;
            active: number;
            idle: number;
            idle_in_transaction: number;
            waiting: number;
          }[]
        >`
        SELECT
          count(*)::int AS total,
          count(*) FILTER (WHERE state = 'active')::int AS active,
          count(*) FILTER (WHERE state = 'idle')::int AS idle,
          count(*) FILTER (WHERE state = 'idle in transaction')::int AS idle_in_transaction,
          count(*) FILTER (WHERE wait_event_type IS NOT NULL AND state = 'active')::int AS waiting
        FROM pg_stat_activity
        WHERE datname = current_database()
      `.catch(() => []),
        prisma.$queryRaw<
          {
            cache_hit_ratio: number | null;
            deadlocks: number;
            temp_files: number;
            temp_bytes: bigint;
            stats_reset: Date | null;
          }[]
        >`
        SELECT
          CASE
            WHEN blks_hit + blks_read = 0 THEN NULL
            ELSE round((blks_hit::numeric / NULLIF(blks_hit + blks_read, 0))::numeric, 4)
          END AS cache_hit_ratio,
          deadlocks::int AS deadlocks,
          temp_files::int AS temp_files,
          temp_bytes,
          stats_reset
        FROM pg_stat_database
        WHERE datname = current_database()
      `.catch(() => []),
        prisma.$queryRaw<{ waiting: number }[]>`
        SELECT count(*)::int AS waiting
        FROM pg_locks
        WHERE NOT granted
      `.catch(() => []),
        prisma.$queryRaw<{ longest_seconds: number | null }[]>`
        SELECT max(EXTRACT(EPOCH FROM (now() - query_start)))::int AS longest_seconds
        FROM pg_stat_activity
        WHERE datname = current_database()
          AND state = 'active'
          AND pid <> pg_backend_pid()
          AND query NOT ILIKE '%pg_stat_activity%'
      `.catch(() => []),
        prisma.$queryRaw<
          {
            current_user: string;
            server_addr: string | null;
            server_port: number | null;
            timezone: string;
          }[]
        >`
        SELECT
          current_user::text AS current_user,
          host(inet_server_addr()) AS server_addr,
          inet_server_port() AS server_port,
          current_setting('TimeZone') AS timezone
      `.catch(() => []),
        prisma.$queryRaw<{ ssl: boolean }[]>`
        SELECT ssl_is_used() AS ssl
      `.catch(() => []),
        prisma.$queryRaw<{ extname: string }[]>`
        SELECT extname FROM pg_extension ORDER BY extname
      `.catch(() => []),
        prisma.$queryRaw<
          {
            schema: string;
            name: string;
            size_bytes: bigint;
            size_pretty: string;
            approx_rows: number | null;
            table_count: number;
          }[]
        >`
        WITH ranked AS (
          SELECT
            n.nspname AS schema,
            c.relname AS name,
            pg_total_relation_size(c.oid) AS size_bytes,
            pg_size_pretty(pg_total_relation_size(c.oid)) AS size_pretty,
            COALESCE(s.n_live_tup, c.reltuples)::bigint AS approx_rows,
            count(*) OVER ()::int AS table_count
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          LEFT JOIN pg_stat_user_tables s
            ON s.relid = c.oid
          WHERE c.relkind = 'r'
            AND n.nspname NOT IN ('pg_catalog', 'information_schema')
          ORDER BY pg_total_relation_size(c.oid) DESC
          LIMIT 8
        )
        SELECT * FROM ranked
      `.catch(() => []),
      ]);

    const info = infoRows[0];
    const conn = connRows[0];
    const cache = cacheRows[0];
    const session = sessionRows[0];
    const sslRow = sslRows[0];
    const locksWaiting = lockRows[0]?.waiting ?? 0;
    const longestQuerySeconds = longRows[0]?.longest_seconds ?? null;
    const maxConnections = info?.max_connections ? Number(info.max_connections) : null;
    const sizeBytes = info?.size_bytes != null ? Number(info.size_bytes) : null;
    const uptimeSeconds = info?.uptime_seconds ?? null;
    const connections = conn
      ? {
          total: conn.total,
          active: conn.active,
          idle: conn.idle,
          idleInTransaction: conn.idle_in_transaction,
          waiting: conn.waiting,
          usagePct:
            maxConnections && maxConnections > 0
              ? Math.round((conn.total / maxConnections) * 1000) / 10
              : null,
        }
      : null;

    const cacheHitRatio =
      cache?.cache_hit_ratio != null ? Number(cache.cache_hit_ratio) : null;

    const topTables: PostgresTableSize[] = tableRows.map((row) => ({
      schema: row.schema,
      name: row.name,
      sizeBytes: Number(row.size_bytes),
      sizeLabel: row.size_pretty,
      approxRows: row.approx_rows != null ? Number(row.approx_rows) : null,
    }));

    const issues = evaluateIssues({
      connected: true,
      latencyMs,
      connections,
      cacheHitRatio,
      locksWaiting,
      longestQuerySeconds,
      idleInTransaction: connections?.idleInTransaction ?? 0,
    });

    return {
      meta,
      connected: true,
      latencyMs,
      error: null,
      version: info?.version ?? null,
      versionShort: info?.version ? shortVersion(info.version) : null,
      uptimeSeconds,
      uptimeLabel: uptimeSeconds != null ? formatUptime(uptimeSeconds) : null,
      sizeBytes,
      sizeLabel: info?.size_pretty ?? (sizeBytes != null ? formatBytes(sizeBytes) : null),
      maxConnections,
      connections,
      cacheHitRatio,
      deadlocks: cache?.deadlocks ?? null,
      tempFiles: cache?.temp_files ?? null,
      tempBytes: cache?.temp_bytes != null ? Number(cache.temp_bytes) : null,
      longestQuerySeconds,
      locksWaiting,
      currentUser: session?.current_user ?? null,
      serverAddr: session?.server_addr ?? null,
      serverPort: session?.server_port ?? null,
      timezone: session?.timezone ?? null,
      sslInUse: sslRow?.ssl ?? null,
      statsResetAt: cache?.stats_reset ? new Date(cache.stats_reset) : null,
      tableCount: tableRows[0]?.table_count ?? (topTables.length > 0 ? topTables.length : null),
      extensionCount: extRows.length,
      extensions: extRows.map((e) => e.extname).slice(0, 24),
      topTables,
      issues,
      overall: overallFromIssues(true, issues),
    };
  } catch (error) {
    const issues = evaluateIssues({
      connected: false,
      latencyMs: null,
      connections: null,
      cacheHitRatio: null,
      locksWaiting: null,
      longestQuerySeconds: null,
      idleInTransaction: 0,
    });
    return {
      meta,
      connected: false,
      latencyMs: null,
      error: error instanceof Error ? error.message : "Unknown database error",
      version: null,
      versionShort: null,
      uptimeSeconds: null,
      uptimeLabel: null,
      sizeBytes: null,
      sizeLabel: null,
      maxConnections: null,
      connections: null,
      cacheHitRatio: null,
      deadlocks: null,
      tempFiles: null,
      tempBytes: null,
      longestQuerySeconds: null,
      locksWaiting: null,
      ...extras,
      issues,
      overall: "down",
    };
  }
}
