import { prisma } from "@/lib/db";
import { warmDatabaseConnection } from "@/lib/db";
import { deductSmsCredits } from "@/lib/sms/billing";
import { processMessageJob, resetStaleProcessingMessages } from "@/lib/queue/process-message";
import { SMS_INLINE_CONCURRENCY } from "@/lib/queue/sms-dispatch-config";
import type { SmsProviderType } from "@/lib/generated/prisma/client";

export type ResendMemberSmsResult = {
  userId: string;
  email: string | null;
  fullName: string;
  retried: number;
  sent: number;
  failed: number;
  remaining: number;
  creditsDeducted: boolean;
  assignedProvider: SmsProviderType;
  failedSamples: Array<{ recipient: string; reason: string | null }>;
};

async function processMemberPendingBatch(userId: string, limit: number) {
  const messages = await prisma.message.findMany({
    where: { userId, status: "PENDING", isSandbox: false },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true, countryCode: true },
  });

  if (messages.length === 0) {
    const remaining = await prisma.message.count({
      where: { userId, status: "PENDING", isSandbox: false },
    });
    return { processed: 0, sent: 0, failed: 0, remaining, failedSamples: [] as ResendMemberSmsResult["failedSamples"] };
  }

  let sent = 0;
  let failed = 0;
  const failedSamples: ResendMemberSmsResult["failedSamples"] = [];

  for (let i = 0; i < messages.length; i += SMS_INLINE_CONCURRENCY) {
    const batch = messages.slice(i, i + SMS_INLINE_CONCURRENCY);
    await Promise.all(
      batch.map(({ id, countryCode }) =>
        processMessageJob(id, countryCode ?? "GH", { skipStaleReset: true }),
      ),
    );
  }

  for (const { id } of messages) {
    const updated = await prisma.message.findUnique({
      where: { id },
      select: { status: true, recipient: true, failureReason: true },
    });
    if (!updated) continue;
    if (updated.status === "SENT" || updated.status === "DELIVERED") sent++;
    else if (updated.status === "FAILED") {
      failed++;
      if (failedSamples.length < 5) {
        failedSamples.push({ recipient: updated.recipient, reason: updated.failureReason });
      }
    }
  }

  const remaining = await prisma.message.count({
    where: { userId, status: "PENDING", isSandbox: false },
  });

  return { processed: messages.length, sent, failed, remaining, failedSamples };
}

export async function resendMemberSmsViaProvider(
  email: string,
  options?: {
    provider?: SmsProviderType;
    deductCredits?: boolean;
    batchSize?: number;
    maxRounds?: number;
    statuses?: Array<"FAILED" | "PENDING" | "PROCESSING">;
  },
): Promise<ResendMemberSmsResult> {
  const normalizedEmail = email.trim().toLowerCase();
  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, fullName: true, wallet: { select: { currency: true } } },
  });

  if (!user) {
    const candidates = await prisma.user.findMany({
      where: { email: { contains: normalizedEmail.replace(/^x/, ""), mode: "insensitive" } },
      select: { id: true, email: true, fullName: true, wallet: { select: { currency: true } } },
      take: 2,
    });
    if (candidates.length !== 1) {
      throw new Error(
        candidates.length === 0
          ? `No account found for ${email}`
          : `Multiple accounts match ${email}; use exact email`,
      );
    }
    user = candidates[0];
  }

  const provider = options?.provider ?? "MNOTIFY";
  const batchSize = Math.min(100, Math.max(1, options?.batchSize ?? 80));
  const maxRounds = Math.min(20, Math.max(1, options?.maxRounds ?? 10));
  const statuses = options?.statuses ?? ["FAILED", "PROCESSING"];

  await warmDatabaseConnection().catch(() => undefined);

  await prisma.memberAccount.upsert({
    where: { userId: user.id },
    create: { userId: user.id, assignedProvider: provider },
    update: { assignedProvider: provider },
  });

  await prisma.message.updateMany({
    where: { userId: user.id, status: "PROCESSING", isSandbox: false },
    data: { status: "PENDING" },
  });

  const toRetry = await prisma.message.findMany({
    where: {
      userId: user.id,
      status: { in: statuses.filter((s) => s !== "PROCESSING") },
      isSandbox: false,
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      countryCode: true,
      smsUnits: true,
      cost: true,
    },
  });

  let creditsDeducted = false;
  if (toRetry.length > 0 && options?.deductCredits) {
    const unitsNeeded = toRetry.reduce((s, m) => s + m.smsUnits, 0);
    const costNeeded = toRetry.reduce((s, m) => s + (m.cost?.toNumber() ?? 0), 0);
    try {
      await deductSmsCredits(
        user.id,
        unitsNeeded,
        costNeeded,
        user.wallet?.currency ?? "GHS",
        `Admin resend ${toRetry.length} messages via ${provider}`,
        toRetry[0]?.countryCode ?? "GH",
      );
      creditsDeducted = true;
    } catch {
      throw new Error("INSUFFICIENT_CREDITS");
    }
  }

  if (toRetry.length > 0) {
    await prisma.message.updateMany({
      where: { id: { in: toRetry.map((m) => m.id) } },
      data: { status: "PENDING", failureReason: null, failedAt: null },
    });
  }

  await resetStaleProcessingMessages();

  let totalSent = 0;
  let totalFailed = 0;
  let totalProcessed = 0;
  let remaining = 0;
  const failedSamples: ResendMemberSmsResult["failedSamples"] = [];

  for (let round = 0; round < maxRounds; round++) {
    const batch = await processMemberPendingBatch(user.id, batchSize);
    totalSent += batch.sent;
    totalFailed += batch.failed;
    totalProcessed += batch.processed;
    remaining = batch.remaining;
    for (const sample of batch.failedSamples) {
      if (failedSamples.length < 5) failedSamples.push(sample);
    }
    if (batch.processed === 0 || batch.remaining === 0) break;
  }

  return {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    retried: toRetry.length,
    sent: totalSent,
    failed: totalFailed,
    remaining,
    creditsDeducted,
    assignedProvider: provider,
    failedSamples,
  };
}
