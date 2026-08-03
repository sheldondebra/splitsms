import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  attachTenantHeaders,
  fetchTenantForMiddleware,
} from "@/lib/reseller/middleware-tenant";
import { verifyImpersonationToken } from "@/lib/auth/impersonation";
import { isPlatformHost, normalizeHost } from "@/lib/reseller/tenant-host";
import { shouldBlockAuthBot } from "@/lib/auth/bot-guard";

const COOKIE_NAME = "splitsms_session";
const RESET_COOKIE = "splitsms_reset";

const memberPaths = ["/dashboard", "/developers", "/onboarding"];
const resellerPaths = ["/reseller"];
const enterprisePaths = ["/enterprise"];
const adminPaths = ["/admin"];
const authPaths = [
  "/login",
  "/signup",
  "/verify-otp",
  "/forgot-password",
  "/complete-phone",
];

async function readSession(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload as { userId: string; role: string; phone: string };
  } catch {
    return null;
  }
}

function hasResetCookie(request: NextRequest) {
  return Boolean(request.cookies.get(RESET_COOKIE)?.value);
}

function loginDestination(session: { role: string }) {
  if (session.role === "ADMIN" || session.role === "SUPER_ADMIN") {
    return "/admin";
  }
  if (session.role === "RESELLER") {
    return "/reseller";
  }
  if (session.role === "ENTERPRISE") {
    return "/enterprise";
  }
  return "/dashboard";
}

function externalResellerPortal(session: { userId: string; role: string }, tenant: { ownerUserId: string } | null) {
  if (!tenant || session.role !== "RESELLER" || session.userId !== tenant.ownerUserId) {
    return null;
  }
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (!base) return null;
  try {
    return new URL("/reseller", base).toString();
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    request.method === "POST" &&
    (pathname.startsWith("/api/auth/") || pathname.startsWith("/api/v1/otp/"))
  ) {
    if (shouldBlockAuthBot(request.headers.get("user-agent"), "POST")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (pathname === "/developers/sdk" || pathname.startsWith("/developers/sdk/")) {
    return NextResponse.redirect(new URL("/sdk", request.url));
  }

  const rawHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const host = normalizeHost(rawHost);
  const onPlatform = isPlatformHost(host);
  const tenant = onPlatform ? null : await fetchTenantForMiddleware(request, rawHost);

  if (tenant) {
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/reseller") ||
      pathname.startsWith("/enterprise")
    ) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  const session = await readSession(request);

  const isMember = memberPaths.some((p) => pathname.startsWith(p));
  const isReseller = resellerPaths.some((p) => pathname.startsWith(p));
  const isEnterprise = enterprisePaths.some((p) => pathname.startsWith(p));
  const isAdmin = adminPaths.some((p) => pathname.startsWith(p));
  const isAuth = authPaths.some((p) => pathname.startsWith(p));
  const isResetPassword = pathname.startsWith("/reset-password");

  if (tenant && (isAdmin || isReseller || isEnterprise) && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if ((isMember || isReseller || isEnterprise || isAdmin) && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAdmin && session && !["ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (
    isEnterprise &&
    session &&
    session.role !== "ENTERPRISE" &&
    !["ADMIN", "SUPER_ADMIN"].includes(session.role)
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isMember && session?.role === "RESELLER" && !tenant) {
    return NextResponse.redirect(new URL("/reseller", request.url));
  }

  if (isMember && session?.role === "ENTERPRISE") {
    return NextResponse.redirect(new URL("/enterprise", request.url));
  }

  if (isResetPassword && !hasResetCookie(request)) {
    return NextResponse.redirect(new URL("/forgot-password?error=session", request.url));
  }

  const isCompleteProfile = pathname.startsWith("/complete-profile");
  if (isCompleteProfile && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isCompleteProfile && session) {
    if (tenant) {
      const requestHeaders = attachTenantHeaders(request, tenant);
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    return NextResponse.next();
  }

  const isCompletePhone = pathname.startsWith("/complete-phone");
  if (isCompletePhone && session) {
    return NextResponse.redirect(new URL(loginDestination(session), request.url));
  }
  if (isCompletePhone) {
    if (tenant) {
      const requestHeaders = attachTenantHeaders(request, tenant);
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    return NextResponse.next();
  }

  if (isAuth && session) {
    const impToken = request.cookies.get("splitsms_impersonate")?.value;
    if (
      (session.role === "ADMIN" || session.role === "SUPER_ADMIN") &&
      impToken
    ) {
      const imp = await verifyImpersonationToken(impToken);
      if (imp?.kind === "reseller" || imp?.resellerId) {
        return NextResponse.redirect(new URL("/reseller", request.url));
      }
    }
    const external = externalResellerPortal(session, tenant);
    if (external) {
      return NextResponse.redirect(external);
    }
    const dest = loginDestination(session);
    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (tenant) {
    const requestHeaders = attachTenantHeaders(request, tenant);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/auth/:path*",
    "/api/v1/otp/:path*",
    "/",
    "/dashboard/:path*",
    "/developers/:path*",
    "/reseller/:path*",
    "/enterprise/:path*",
    "/admin/:path*",
    "/login",
    "/signup",
    "/verify-otp",
    "/forgot-password",
    "/reset-password",
    "/complete-profile",
    "/complete-phone",
    "/onboarding",
  ],
};
