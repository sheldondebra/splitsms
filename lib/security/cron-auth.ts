/**
 * Cron endpoints must fail closed in production.
 * Locally, an unset CRON_SECRET is allowed so `npm run dev` can hit the routes.
 */
export function isCronAuthorized(
  request: Request,
  env: { NODE_ENV?: string; CRON_SECRET?: string } = process.env,
): boolean {
  const secret = env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization");
  const production = (env.NODE_ENV ?? "development") === "production";

  if (production) {
    if (!secret) return false;
    return auth === `Bearer ${secret}`;
  }

  if (!secret) return true;
  return auth === `Bearer ${secret}`;
}
