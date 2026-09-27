import { prisma } from "@/lib/db";
import { getQstashScheduleStatuses, type QstashScheduleStatus } from "@/lib/queue/qstash-schedule-status";
import { isGoogleServiceAccountConfigured, getGoogleServiceAccountAccessToken } from "@/lib/google/service-account";
import { googleFormsServiceAccountEmail } from "@/lib/google/sheet-id";
import { getGoogleClientCredentials } from "@/lib/auth/google";
import { getActiveEmailProvider, testEmailConnection } from "@/lib/email";
import { getPostgresHealth, type PostgresHealth } from "@/lib/admin/postgres-health";
import { getVercelStatus, type VercelStatus } from "@/lib/admin/vercel-status";
import {
  getSystemSyncHistory,
  type SystemSyncHistoryEntry,
} from "@/lib/admin/system-sync-history";

export type { VercelStatus } from "@/lib/admin/vercel-status";

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

export type DatabaseStatus = {
  connected: boolean;
  latencyMs: number | null;
  error: string | null;
  sizeLabel: string | null;
  counts: {
    users: number;
    messagesTotal: number;
    messagesToday: number;
    wallets: number;
  } | null;
  /** Live Postgres / Supabase health snapshot */
  health: PostgresHealth;
};

export type GoogleStatus = {
  oauthConfigured: boolean;
  sheetsConfigured: boolean;
  sheetsServiceAccountEmail: string;
  sheetsConnected: boolean | null;
  sheetsError: string | null;
};

export type EmailStatus = {
  provider: string | null;
  connected: boolean;
  error: string | null;
  fromEmail: string | null;
  host: string | null;
};

export type FileUpload = {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  uploaderName: string;
  senderValue: string;
  createdAt: Date;
  kind: "sender_id_document";
};

export type UpdateLogEntry = {
  id: string;
  source: "vercel" | "system_sync" | "cron";
  title: string;
  detail: string;
  status: "ok" | "warn" | "danger" | "muted";
  at: Date;
  href: string | null;
};

export type SystemStatus = {
  vercel: VercelStatus;
  database: DatabaseStatus;
  google: GoogleStatus;
  cronJobs: QstashScheduleStatus[];
  email: EmailStatus;
  fileUploads: FileUpload[];
  fileUploadsTotal: number;
  syncHistory: SystemSyncHistoryEntry[];
  updateLogs: UpdateLogEntry[];
  generatedAt: Date;
};

async function getDatabaseStatus(): Promise<DatabaseStatus> {
  const health = await getPostgresHealth();

  if (!health.connected) {
    return {
      connected: false,
      latencyMs: health.latencyMs,
      error: health.error,
      sizeLabel: health.sizeLabel,
      counts: null,
      health,
    };
  }

  try {
    const [users, messagesTotal, messagesToday, wallets] = await Promise.all([
      prisma.user.count(),
      prisma.message.count(),
      prisma.message.count({
        where: { createdAt: { gte: new Date(new Date().setUTCHours(0, 0, 0, 0)) } },
      }),
      prisma.wallet.count(),
    ]);

    return {
      connected: true,
      latencyMs: health.latencyMs,
      error: null,
      sizeLabel: health.sizeLabel,
      counts: { users, messagesTotal, messagesToday, wallets },
      health,
    };
  } catch (error) {
    return {
      connected: false,
      latencyMs: health.latencyMs,
      error: error instanceof Error ? error.message : "Unknown database error",
      sizeLabel: health.sizeLabel,
      counts: null,
      health: {
        ...health,
        connected: false,
        error: error instanceof Error ? error.message : "Unknown database error",
        overall: "down",
        issues: [
          ...health.issues,
          {
            severity: "danger",
            code: "app_query_failed",
            message: error instanceof Error ? error.message : "App query failed",
          },
        ],
      },
    };
  }
}

async function getGoogleStatus(): Promise<GoogleStatus> {
  const oauthConfigured = getGoogleClientCredentials() != null;
  const sheetsConfigured = isGoogleServiceAccountConfigured();

  let sheetsConnected: boolean | null = null;
  let sheetsError: string | null = null;
  if (sheetsConfigured) {
    try {
      await withTimeout(getGoogleServiceAccountAccessToken(), 10_000, null).then((token) => {
        if (!token) throw new Error("Timed out fetching Google token");
      });
      sheetsConnected = true;
    } catch (error) {
      sheetsConnected = false;
      sheetsError = error instanceof Error ? error.message : "Unknown Google error";
    }
  }

  return {
    oauthConfigured,
    sheetsConfigured,
    sheetsServiceAccountEmail: googleFormsServiceAccountEmail(),
    sheetsConnected,
    sheetsError,
  };
}

async function getEmailStatus(): Promise<EmailStatus> {
  const provider = await getActiveEmailProvider();
  if (!provider) {
    return { provider: null, connected: false, error: "No email provider configured", fromEmail: null, host: null };
  }
  const result = await withTimeout(testEmailConnection(), 12_000, {
    ok: false,
    error: "Timed out testing email connection",
  });
  return {
    provider,
    connected: result.ok,
    error: result.ok ? null : (result.error ?? "Connection failed"),
    fromEmail: "fromEmail" in result ? (result.fromEmail ?? null) : null,
    host: "host" in result ? (result.host ?? null) : null,
  };
}

async function getFileUploads(): Promise<{ recent: FileUpload[]; total: number }> {
  const [rows, total] = await Promise.all([
    prisma.$queryRaw<
      {
        id: string;
        filename: string;
        contentType: string;
        size: bigint;
        createdAt: Date;
        uploaderName: string | null;
        uploaderEmail: string | null;
        senderValue: string;
      }[]
    >`SELECT d.id, d.filename, d."contentType", octet_length(d.content) AS size, d."createdAt",
        u."fullName" AS "uploaderName", u.email AS "uploaderEmail", s.value AS "senderValue"
      FROM "SenderIdVerificationDocument" d
      JOIN "User" u ON u.id = d."userId"
      JOIN "SenderId" s ON s.id = d."senderId"
      ORDER BY d."createdAt" DESC
      LIMIT 15`,
    prisma.senderIdVerificationDocument.count(),
  ]);

  return {
    recent: rows.map((row) => ({
      id: row.id,
      filename: row.filename,
      contentType: row.contentType,
      sizeBytes: Number(row.size),
      uploaderName: row.uploaderName?.trim() || row.uploaderEmail || "Unknown",
      senderValue: row.senderValue,
      createdAt: row.createdAt,
      kind: "sender_id_document" as const,
    })),
    total,
  };
}

function buildUpdateLogs(input: {
  vercel: VercelStatus;
  cronJobs: QstashScheduleStatus[];
  syncHistory: SystemSyncHistoryEntry[];
}): UpdateLogEntry[] {
  const logs: UpdateLogEntry[] = [];

  for (const deployment of input.vercel.deployments) {
    const state = deployment.state.toUpperCase();
    const status: UpdateLogEntry["status"] =
      state === "READY" || state === "SUCCESS"
        ? "ok"
        : state === "ERROR" || state === "CANCELED"
          ? "danger"
          : state === "BUILDING" || state === "QUEUED" || state === "INITIALIZING"
            ? "warn"
            : "muted";
    const sha = deployment.meta.gitCommitSha?.slice(0, 7);
    const branch = deployment.meta.gitBranch;
    logs.push({
      id: `vercel-${deployment.id}`,
      source: "vercel",
      title: `Deploy ${state.toLowerCase()}${deployment.target ? ` · ${deployment.target}` : ""}`,
      detail: [
        deployment.meta.gitCommitMessage?.slice(0, 120) || deployment.url || deployment.id,
        [sha, branch].filter(Boolean).join(" · ") || null,
      ]
        .filter(Boolean)
        .join(" · "),
      status,
      at: deployment.readyAt ?? deployment.createdAt,
      href: deployment.inspectorUrl,
    });
  }

  for (const entry of input.syncHistory.slice(0, 12)) {
    logs.push({
      id: `sync-${entry.id}`,
      source: "system_sync",
      title: entry.ok ? "System sync completed" : "System sync finished with issues",
      detail: `${entry.actorName} · ${entry.summary.sent} sent · ${entry.summary.failed} failed · ${entry.summary.deliveryRowsUpdated} delivery updates`,
      status: entry.ok ? "ok" : "warn",
      at: entry.createdAt,
      href: "/admin/system-sync",
    });
  }

  for (const job of input.cronJobs) {
    if (!job.lastRunAt) continue;
    logs.push({
      id: `cron-${job.destination}`,
      source: "cron",
      title: `${job.label} cron`,
      detail: job.isPaused
        ? "Paused"
        : job.lastRunOk === false
          ? "Last run failed"
          : job.lastRunOk
            ? "Last run succeeded"
            : "Last run recorded",
      status: job.isPaused
        ? "warn"
        : job.lastRunOk === false
          ? "danger"
          : job.lastRunOk
            ? "ok"
            : "muted",
      at: job.lastRunAt,
      href: null,
    });
  }

  return logs.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 24);
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const [database, google, cronJobs, email, fileUploads, vercel, syncHistory] = await Promise.all([
    getDatabaseStatus(),
    getGoogleStatus(),
    getQstashScheduleStatuses(),
    getEmailStatus(),
    getFileUploads(),
    getVercelStatus(),
    getSystemSyncHistory(12),
  ]);

  return {
    vercel,
    database,
    google,
    cronJobs,
    email,
    fileUploads: fileUploads.recent,
    fileUploadsTotal: fileUploads.total,
    syncHistory,
    updateLogs: buildUpdateLogs({ vercel, cronJobs, syncHistory }),
    generatedAt: new Date(),
  };
}
