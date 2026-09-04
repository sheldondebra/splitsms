import { prisma } from "@/lib/db";
import { getQstashScheduleStatuses, type QstashScheduleStatus } from "@/lib/queue/qstash-schedule-status";
import { isGoogleServiceAccountConfigured, getGoogleServiceAccountAccessToken } from "@/lib/google/service-account";
import { googleFormsServiceAccountEmail } from "@/lib/google/sheet-id";
import { getGoogleClientCredentials } from "@/lib/auth/google";
import { getActiveEmailProvider, testEmailConnection } from "@/lib/email";

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

export type VercelStatus = {
  onVercel: boolean;
  env: string | null;
  region: string | null;
  deploymentId: string | null;
  url: string | null;
  gitProvider: string | null;
  gitRepo: string | null;
  gitBranch: string | null;
  gitCommitSha: string | null;
  gitCommitMessage: string | null;
  gitCommitAuthor: string | null;
};

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

export type SystemStatus = {
  vercel: VercelStatus;
  database: DatabaseStatus;
  google: GoogleStatus;
  cronJobs: QstashScheduleStatus[];
  email: EmailStatus;
  fileUploads: FileUpload[];
  fileUploadsTotal: number;
  generatedAt: Date;
};

function getVercelStatus(): VercelStatus {
  const onVercel = process.env.VERCEL === "1";
  return {
    onVercel,
    env: process.env.VERCEL_ENV ?? null,
    region: process.env.VERCEL_REGION ?? null,
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
    url: process.env.VERCEL_URL ?? null,
    gitProvider: process.env.VERCEL_GIT_PROVIDER ?? null,
    gitRepo:
      process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
        ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`
        : null,
    gitBranch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    gitCommitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE ?? null,
    gitCommitAuthor: process.env.VERCEL_GIT_COMMIT_AUTHOR_LOGIN ?? null,
  };
}

async function getDatabaseStatus(): Promise<DatabaseStatus> {
  const started = Date.now();
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, 8_000, null);
    const latencyMs = Date.now() - started;

    const [sizeRow, users, messagesTotal, messagesToday, wallets] = await Promise.all([
      prisma
        .$queryRaw<{ size: string }[]>`SELECT pg_size_pretty(pg_database_size(current_database())) AS size`
        .catch(() => null),
      prisma.user.count(),
      prisma.message.count(),
      prisma.message.count({
        where: { createdAt: { gte: new Date(new Date().setUTCHours(0, 0, 0, 0)) } },
      }),
      prisma.wallet.count(),
    ]);

    return {
      connected: true,
      latencyMs,
      error: null,
      sizeLabel: sizeRow?.[0]?.size ?? null,
      counts: { users, messagesTotal, messagesToday, wallets },
    };
  } catch (error) {
    return {
      connected: false,
      latencyMs: null,
      error: error instanceof Error ? error.message : "Unknown database error",
      sizeLabel: null,
      counts: null,
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

export async function getSystemStatus(): Promise<SystemStatus> {
  const [database, google, cronJobs, email, fileUploads] = await Promise.all([
    getDatabaseStatus(),
    getGoogleStatus(),
    getQstashScheduleStatuses(),
    getEmailStatus(),
    getFileUploads(),
  ]);

  return {
    vercel: getVercelStatus(),
    database,
    google,
    cronJobs,
    email,
    fileUploads: fileUploads.recent,
    fileUploadsTotal: fileUploads.total,
    generatedAt: new Date(),
  };
}
