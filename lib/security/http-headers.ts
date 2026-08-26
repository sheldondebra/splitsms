/**
 * Browser security headers for next.config.ts.
 * No frame-ancestors / X-Frame-Options here — public forms at /f and /embed must stay embeddable.
 */

export const SECURITY_HEADERS: { key: string; value: string }[] = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

export const CLICKJACK_HEADERS: { key: string; value: string }[] = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
];

/** Authenticated and auth screens that must not be framed. */
export const CLICKJACK_PATHS = [
  "/dashboard/:path*",
  "/admin/:path*",
  "/developers/:path*",
  "/reseller/:path*",
  "/enterprise/:path*",
  "/onboarding/:path*",
  "/login",
  "/signup",
  "/verify-otp",
  "/forgot-password",
  "/reset-password",
  "/complete-profile",
  "/complete-phone",
];
