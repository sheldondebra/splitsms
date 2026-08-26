import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { UserRole } from "@/lib/generated/prisma/client";
import {
  clearImpersonationCookie,
  readImpersonationCookie,
} from "@/lib/auth/impersonation";

const COOKIE_NAME = "splitsms_session";

export type SessionPayload = {
  userId: string;
  role: UserRole;
  phone: string;
  /** Present when an admin is viewing the portal as a reseller or staff user. */
  impersonatorId?: string;
  impersonatedResellerId?: string;
  impersonatedBusinessName?: string;
  impersonatedStaffName?: string;
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

function cookieSecure() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return (
    process.env.NODE_ENV === "production" &&
    (appUrl ? appUrl.startsWith("https://") : true)
  );
}

async function readCookieSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(payload: SessionPayload) {
  const { impersonatorId: _i, impersonatedResellerId: _r, impersonatedBusinessName: _b, ...core } =
    payload;
  const token = await new SignJWT(core)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  await clearImpersonationCookie();
}

/** True when a session cookie exists — does not decode or return user fields. */
export async function hasSessionCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get(COOKIE_NAME)?.value);
}

/** Real signed-in user (never swapped for impersonation). Use for admin gates. */
export const getRealSession = cache(async (): Promise<SessionPayload | null> => {
  return readCookieSession();
});

/**
 * Effective session for app behavior.
 * When an admin is impersonating a reseller, returns the partner owner identity.
 */
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const real = await readCookieSession();
  if (!real) return null;

  if (!isAdminRole(real.role)) return real;

  const imp = await readImpersonationCookie();
  if (!imp || imp.adminUserId !== real.userId) return real;

  if (imp.kind === "staff" && imp.targetRole) {
    return {
      userId: imp.targetUserId,
      role: imp.targetRole,
      phone: imp.targetPhone,
      impersonatorId: real.userId,
      impersonatedStaffName: imp.targetName,
    };
  }

  if (imp.resellerId) {
    return {
      userId: imp.targetUserId,
      role: "RESELLER",
      phone: imp.targetPhone,
      impersonatorId: real.userId,
      impersonatedResellerId: imp.resellerId,
      impersonatedBusinessName: imp.businessName,
    };
  }

  return real;
});

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  await clearImpersonationCookie();
}

export function isAdminRole(role: UserRole) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function isSuperAdmin(role: UserRole) {
  return role === "SUPER_ADMIN";
}

export function isImpersonating(session: SessionPayload | null | undefined) {
  return Boolean(session?.impersonatorId);
}
