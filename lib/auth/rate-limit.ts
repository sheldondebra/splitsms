import { prisma } from "@/lib/db";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const LOCKOUT_MS = 30 * 60 * 1000;

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number; reason: string };

function authAttemptDelegate() {
  const delegate = prisma.authAttempt;
  if (!delegate?.findUnique) {
    throw new Error(
      "Prisma client is out of date (missing authAttempt). Restart the dev server after running: npx prisma generate",
    );
  }
  return delegate;
}

export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  const row = await authAttemptDelegate().findUnique({ where: { key } });
  const now = Date.now();

  if (row?.blockedUntil && row.blockedUntil.getTime() > now) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((row.blockedUntil.getTime() - now) / 1000),
      reason: "Too many attempts. Try again later.",
    };
  }

  if (row && row.attempts >= MAX_ATTEMPTS) {
    const windowStart = row.updatedAt.getTime();
    if (now - windowStart < WINDOW_MS) {
      await authAttemptDelegate().update({
        where: { key },
        data: { blockedUntil: new Date(now + LOCKOUT_MS) },
      });
      return {
        allowed: false,
        retryAfterSec: Math.ceil(LOCKOUT_MS / 1000),
        reason: "Too many attempts. Account temporarily locked.",
      };
    }
    await authAttemptDelegate().update({
      where: { key },
      data: { attempts: 0, blockedUntil: null },
    });
  }

  return { allowed: true };
}

export async function recordFailedAttempt(key: string) {
  const row = await authAttemptDelegate().upsert({
    where: { key },
    create: { key, attempts: 1 },
    update: { attempts: { increment: 1 } },
  });

  if (row.attempts >= MAX_ATTEMPTS) {
    await authAttemptDelegate().update({
      where: { key },
      data: { blockedUntil: new Date(Date.now() + LOCKOUT_MS) },
    });
  }
}

export async function clearRateLimit(key: string) {
  await authAttemptDelegate().deleteMany({ where: { key } });
}

export function rateLimitKey(scope: string, identifier: string) {
  return `${scope}:${identifier.toLowerCase()}`;
}
