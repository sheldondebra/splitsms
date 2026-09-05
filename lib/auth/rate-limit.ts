/**
 * Durable auth rate limits, backed by Postgres.
 *
 * A previous in-memory implementation kept counters in a plain Map, which
 * only works within a single long-lived process. On Vercel each request can
 * land on a different, isolated serverless instance, so an in-memory Map
 * neither reliably blocks abusive traffic nor reliably remembers a lockout —
 * both matter here (auth, OTP, support chat), so state has to live in the
 * shared database instead.
 */
import { prisma } from "@/lib/db";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const LOCKOUT_MS = 30 * 60 * 1000;
const PRUNE_AFTER_MS = 24 * 60 * 60 * 1000;
const PRUNE_PROBABILITY = 0.02;

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number; reason: string };

function maybePrune() {
  if (Math.random() > PRUNE_PROBABILITY) return;
  const cutoff = new Date(Date.now() - PRUNE_AFTER_MS);
  void prisma.rateLimitBucket.deleteMany({ where: { updatedAt: { lt: cutoff } } }).catch(() => undefined);
}

function blockedResult(until: Date, now: number, reason: string): RateLimitResult {
  return {
    allowed: false,
    retryAfterSec: Math.max(1, Math.ceil((until.getTime() - now) / 1000)),
    reason,
  };
}

export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  maybePrune();
  const now = Date.now();
  const row = await prisma.rateLimitBucket.findUnique({ where: { key } });
  if (!row) return { allowed: true };

  if (row.blockedUntil && row.blockedUntil.getTime() > now) {
    return blockedResult(row.blockedUntil, now, "Too many attempts. Try again later.");
  }

  if (row.attempts >= MAX_ATTEMPTS && now - row.windowStart.getTime() < WINDOW_MS) {
    const blockedUntil = new Date(now + LOCKOUT_MS);
    await prisma.rateLimitBucket.update({ where: { key }, data: { blockedUntil } });
    return blockedResult(blockedUntil, now, "Too many attempts. Account temporarily locked.");
  }

  if (now - row.windowStart.getTime() >= WINDOW_MS) {
    await prisma.rateLimitBucket.update({
      where: { key },
      data: { attempts: 0, windowStart: new Date(now), blockedUntil: null },
    });
  }

  return { allowed: true };
}

export async function recordFailedAttempt(key: string) {
  maybePrune();
  const now = Date.now();
  const row = await prisma.rateLimitBucket.findUnique({ where: { key } });

  if (!row) {
    const attempts = 1;
    await prisma.rateLimitBucket.create({
      data: {
        key,
        attempts,
        windowStart: new Date(now),
        blockedUntil: attempts >= MAX_ATTEMPTS ? new Date(now + LOCKOUT_MS) : null,
      },
    });
    return;
  }

  const windowExpired = now - row.windowStart.getTime() >= WINDOW_MS;
  const attempts = (windowExpired ? 0 : row.attempts) + 1;
  await prisma.rateLimitBucket.update({
    where: { key },
    data: {
      attempts,
      windowStart: windowExpired ? new Date(now) : row.windowStart,
      blockedUntil: attempts >= MAX_ATTEMPTS ? new Date(now + LOCKOUT_MS) : windowExpired ? null : row.blockedUntil,
    },
  });
}

export async function clearRateLimit(key: string) {
  await prisma.rateLimitBucket.delete({ where: { key } }).catch(() => undefined);
}

export function rateLimitKey(scope: string, identifier: string) {
  return `${scope}:${identifier.toLowerCase()}`;
}

/** Increment a counter and block when max attempts are exceeded within the window. */
export async function consumeRateLimitSlot(
  key: string,
  options: { maxAttempts: number; windowMs: number; lockoutMs?: number },
): Promise<RateLimitResult> {
  maybePrune();
  const lockoutMs = options.lockoutMs ?? LOCKOUT_MS;
  const now = Date.now();
  const row = await prisma.rateLimitBucket.findUnique({ where: { key } });

  if (row?.blockedUntil && row.blockedUntil.getTime() > now) {
    return blockedResult(row.blockedUntil, now, "Too many attempts. Try again later.");
  }

  const windowExpired = !row || now - row.windowStart.getTime() >= options.windowMs;
  const currentAttempts = windowExpired ? 0 : (row?.attempts ?? 0);

  if (currentAttempts >= options.maxAttempts) {
    const blockedUntil = new Date(now + lockoutMs);
    await prisma.rateLimitBucket.upsert({
      where: { key },
      create: { key, attempts: currentAttempts, windowStart: new Date(now), blockedUntil },
      update: { blockedUntil },
    });
    return blockedResult(blockedUntil, now, "Too many attempts. Try again later.");
  }

  await prisma.rateLimitBucket.upsert({
    where: { key },
    create: { key, attempts: 1, windowStart: new Date(now), blockedUntil: null },
    update: {
      attempts: currentAttempts + 1,
      windowStart: windowExpired ? new Date(now) : (row?.windowStart ?? new Date(now)),
      blockedUntil: null,
    },
  });

  return { allowed: true };
}
