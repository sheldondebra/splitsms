import { getSiteUrl } from "@/lib/site-config";

/** Origin for payment provider return URLs — prefer the live request host over a stale localhost env. */
export function resolveCheckoutAppUrl(request: Request): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return getSiteUrl();

  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
    (host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  const origin = `${proto}://${host}`.replace(/\/$/, "");
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

  if (envUrl?.includes("localhost") && !host.includes("localhost") && !host.startsWith("127.0.0.1")) {
    return origin;
  }

  if (!host.includes("localhost") && !host.startsWith("127.0.0.1")) {
    return origin;
  }

  return envUrl || origin;
}
