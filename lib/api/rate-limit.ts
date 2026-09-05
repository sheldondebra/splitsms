import { prisma } from "@/lib/db";

const WINDOW_MS = 60_000;
const PRUNE_PROBABILITY = 0.02;
const PRUNE_AFTER_MS = 24 * 60 * 60 * 1000;

function maybePrune() {
  if (Math.random() > PRUNE_PROBABILITY) return;
  const cutoff = new Date(Date.now() - PRUNE_AFTER_MS);
  void prisma.rateLimitBucket.deleteMany({ where: { updatedAt: { lt: cutoff } } }).catch(() => undefined);
}

/**
 * Durable per-API-key rate limit, backed by Postgres. An in-memory Map here
 * would reset (or diverge) across the separate serverless instances Vercel
 * routes a single API key's traffic through, so counts have to live in the
 * shared database instead.
 */
export async function checkRateLimit(
  apiKeyId: string,
  limitPerMinute: number,
): Promise<{ ok: boolean; remaining: number; resetAt: number }> {
  maybePrune();
  const key = `api:${apiKeyId}`;
  const now = Date.now();
  const row = await prisma.rateLimitBucket.findUnique({ where: { key } });

  const windowExpired = !row || now - row.windowStart.getTime() >= WINDOW_MS;
  const windowStart = windowExpired ? new Date(now) : row!.windowStart;
  const currentCount = windowExpired ? 0 : row!.attempts;
  const nextCount = currentCount + 1;
  const resetAt = windowStart.getTime() + WINDOW_MS;

  await prisma.rateLimitBucket.upsert({
    where: { key },
    create: { key, attempts: nextCount, windowStart },
    update: { attempts: nextCount, windowStart },
  });

  if (nextCount > limitPerMinute) {
    return { ok: false, remaining: 0, resetAt };
  }
  return { ok: true, remaining: limitPerMinute - nextCount, resetAt };
}

/** Plan presets from Batch 5 spec */
export const RATE_LIMIT_TIERS = {
  free: 10,
  standard: 100,
  enterprise: 1000,
} as const;
