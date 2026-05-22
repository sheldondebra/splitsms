import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "splitsms_session";
const RESET_COOKIE = "splitsms_reset";

const memberPaths = ["/dashboard", "/developers"];
const adminPaths = ["/admin"];
const authPaths = [
  "/login",
  "/signup",
  "/verify-otp",
  "/forgot-password",
];

const publicAuthWhenLoggedOut = [...authPaths, "/reset-password"];

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await readSession(request);

  const isMember = memberPaths.some((p) => pathname.startsWith(p));
  const isAdmin = adminPaths.some((p) => pathname.startsWith(p));
  const isAuth = authPaths.some((p) => pathname.startsWith(p));
  const isResetPassword = pathname.startsWith("/reset-password");

  if ((isMember || isAdmin) && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAdmin && session && !["ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isResetPassword && !hasResetCookie(request)) {
    return NextResponse.redirect(new URL("/forgot-password?error=session", request.url));
  }

  if (isAuth && session) {
    const dest =
      session.role === "ADMIN" || session.role === "SUPER_ADMIN" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/developers/:path*",
    "/admin/:path*",
    "/login",
    "/signup",
    "/verify-otp",
    "/forgot-password",
    "/reset-password",
  ],
};
