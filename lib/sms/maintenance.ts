/** Explicit instants only: never infer a provider maintenance zone from the host. */
export function mnotifyMaintenanceHold(
  now = Date.now(),
  env: Record<string, string | undefined> = process.env,
): { active: boolean; reason?: string } {
  const start = env.MNOTIFY_MAINTENANCE_START?.trim();
  const end = env.MNOTIFY_MAINTENANCE_END?.trim();
  if (!start && !end) return { active: false };
  const instant = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;
  const from = start && instant.test(start) ? Date.parse(start) : NaN;
  const until = end && instant.test(end) ? Date.parse(end) : NaN;
  if (!Number.isFinite(from) || !Number.isFinite(until) || until <= from) {
    return { active: true, reason: "Invalid mNotify maintenance configuration; operator review required" };
  }
  return now >= from && now < until
    ? { active: true, reason: `mNotify maintenance: queued until ${new Date(until).toISOString()}` }
    : { active: false };
}

export const MAINTENANCE_HOLD_PREFIX = "provider-maintenance:";
export const UNKNOWN_SUBMISSION_PREFIX = "submission-unknown:";
