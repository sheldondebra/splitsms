/**
 * In-memory auth rate limits (fast path).
 * Avoids a database round-trip on every login / OTP / signup attempt.
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const LOCKOUT_MS = 30 * 60 * 1000;
const PRUNE_AFTER_MS = 24 * 60 * 60 * 1000;

type Entry = {
  attempts: number;
  windowStart: number;
  blockedUntil: number | null;
  lastSeen: number;
};

const store = new Map<string, Entry>();

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number; reason: string };

function pruneStale(now: number) {
  if (store.size < 500) return;
  for (const [key, row] of store) {
    if (now - row.lastSeen > PRUNE_AFTER_MS) store.delete(key);
  }
}

function getEntry(key: string, now: number): Entry {
  let row = store.get(key);
  if (!row) {
    row = { attempts: 0, windowStart: now, blockedUntil: null, lastSeen: now };
    store.set(key, row);
  }
  row.lastSeen = now;
  return row;
}

function blockedResult(until: number, now: number, reason: string): RateLimitResult {
  return {
    allowed: false,
    retryAfterSec: Math.max(1, Math.ceil((until - now) / 1000)),
    reason,
  };
}

export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  const now = Date.now();
  pruneStale(now);
  const row = store.get(key);

  if (row?.blockedUntil && row.blockedUntil > now) {
    return blockedResult(row.blockedUntil, now, "Too many attempts. Try again later.");
  }

  if (row && row.attempts >= MAX_ATTEMPTS && now - row.windowStart < WINDOW_MS) {
    row.blockedUntil = now + LOCKOUT_MS;
    return blockedResult(row.blockedUntil, now, "Too many attempts. Account temporarily locked.");
  }

  if (row && now - row.windowStart >= WINDOW_MS) {
    row.attempts = 0;
    row.windowStart = now;
    row.blockedUntil = null;
  }

  return { allowed: true };
}

export async function recordFailedAttempt(key: string) {
  const now = Date.now();
  pruneStale(now);
  const row = getEntry(key, now);

  if (now - row.windowStart >= WINDOW_MS) {
    row.attempts = 0;
    row.windowStart = now;
    row.blockedUntil = null;
  }

  row.attempts += 1;
  if (row.attempts >= MAX_ATTEMPTS) {
    row.blockedUntil = now + LOCKOUT_MS;
  }
}

export async function clearRateLimit(key: string) {
  store.delete(key);
}

export function rateLimitKey(scope: string, identifier: string) {
  return `${scope}:${identifier.toLowerCase()}`;
}

/** Increment a counter and block when max attempts are exceeded within the window. */
export async function consumeRateLimitSlot(
  key: string,
  options: { maxAttempts: number; windowMs: number; lockoutMs?: number },
): Promise<RateLimitResult> {
  const lockoutMs = options.lockoutMs ?? LOCKOUT_MS;
  const now = Date.now();
  pruneStale(now);
  const row = getEntry(key, now);

  if (row.blockedUntil && row.blockedUntil > now) {
    return blockedResult(row.blockedUntil, now, "Too many attempts. Try again later.");
  }

  if (now - row.windowStart >= options.windowMs) {
    row.attempts = 0;
    row.windowStart = now;
    row.blockedUntil = null;
  }

  if (row.attempts >= options.maxAttempts) {
    row.blockedUntil = now + lockoutMs;
    return blockedResult(row.blockedUntil, now, "Too many attempts. Try again later.");
  }

  row.attempts += 1;
  return { allowed: true };
}
