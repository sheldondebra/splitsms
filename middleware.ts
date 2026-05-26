import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  attachTenantHeaders,
  fetchTenantForMiddleware,
} from "@/lib/reseller/middleware-tenant";
import { isPlatformHost, normalizeHost } from "@/lib/reseller/tenant-host";

const COOKIE_NAME = "splitsms_session";
const RESET_COOKIE = "splitsms_reset";

const memberPaths = ["/dashboard", "/developers"];
const resellerPaths = ["/reseller"];
const enterprisePaths = ["/enterprise"];
const adminPaths = ["/admin"];
const authPaths = [
  "/login",
  "/signup",
  "/verify-otp",
  "/forgot-password",
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
      pathname.startsWith("/enterprise") ||
      pathname.startsWith("/signup")
    ) {
      const dest = pathname.startsWith("/signup") ? "/login?error=tenant_signup" : "/login";
      return NextResponse.redirect(new URL(dest, request.url));
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

  if (isAuth && session) {
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
  ],
};
