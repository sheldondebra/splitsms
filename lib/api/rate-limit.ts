const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limitPerMinute: number,
): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const windowMs = 60_000;
  let bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count++;
  if (bucket.count > limitPerMinute) {
    return { ok: false, remaining: 0, resetAt: bucket.resetAt };
  }
  return { ok: true, remaining: limitPerMinute - bucket.count, resetAt: bucket.resetAt };
}

/** Plan presets from Batch 5 spec */
export const RATE_LIMIT_TIERS = {
  free: 10,
  standard: 100,
  enterprise: 1000,
} as const;
