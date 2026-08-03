import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import { recordDeviceSession } from "@/lib/auth/device-session";
import { logAuthEvent } from "@/lib/auth/audit";
import { getMemberAccountForUser, isMemberSuspended } from "@/lib/admin/member-account";
import { assertTenantLoginAllowed } from "@/lib/auth/tenant-login";
import { userNeedsOnboarding } from "@/lib/onboarding";
import { userNeedsProfileCompletion } from "@/lib/auth/phone-auth";
import {
  clearGooglePendingCookie,
  resolveGoogleAccountAction,
  type GoogleIdentity,
} from "@/lib/auth/google";
import type { UserRole } from "@/lib/generated/prisma/client";

function parseSafeReturnTo(raw: string | undefined | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export async function destinationForUser(user: {
  id: string;
  role: UserRole;
  fullName: string;
}): Promise<string> {
  if (userNeedsProfileCompletion(user.fullName)) {
    return "/complete-profile";
  }
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    return "/admin";
  }
  if (user.role === "RESELLER") {
    return "/reseller";
  }
  if (user.role === "ENTERPRISE") {
    return "/enterprise";
  }
  if (user.role === "MEMBER" && (await userNeedsOnboarding(user.id))) {
    return "/onboarding";
  }
  return "/dashboard";
}

export async function establishGoogleSession(user: {
  id: string;
  role: UserRole;
  phone: string;
  fullName: string;
}, returnTo?: string | null): Promise<string> {
  await assertTenantLoginAllowed(user.id, user.role);

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null },
  });

  await createSession({
    userId: user.id,
    role: user.role,
    phone: user.phone,
  });
  await recordDeviceSession(user.id);
  await logAuthEvent(
    "LOGIN_SUCCESS",
    { phone: user.phone, method: "google" },
    user.id,
  );
  await clearGooglePendingCookie();

  const safeReturn = parseSafeReturnTo(returnTo);
  if (safeReturn && (user.role === "ADMIN" || user.role === "SUPER_ADMIN")) {
    return safeReturn;
  }

  return destinationForUser(user);
}

/**
 * Find existing user by Google id / email, or signal that phone collection is required.
 */
export async function resolveGoogleSignIn(identity: GoogleIdentity): Promise<
  | {
      status: "ready";
      user: {
        id: string;
        role: UserRole;
        phone: string;
        fullName: string;
        countryCode: string;
        isVerified: boolean;
      };
    }
  | { status: "needs_phone" }
  | { status: "suspended" }
  | { status: "conflict" }
> {
  const byGoogleId = await prisma.user.findUnique({
    where: { googleId: identity.googleId },
    select: {
      id: true,
      role: true,
      phone: true,
      fullName: true,
      googleId: true,
      countryCode: true,
      isVerified: true,
    },
  });

  const byEmail = await prisma.user.findUnique({
    where: { email: identity.email },
    select: {
      id: true,
      role: true,
      phone: true,
      fullName: true,
      googleId: true,
      countryCode: true,
      isVerified: true,
    },
  });

  const action = resolveGoogleAccountAction({
    byGoogleId: byGoogleId ? { id: byGoogleId.id } : null,
    byEmail: byEmail
      ? { id: byEmail.id, googleId: byEmail.googleId }
      : null,
  });

  if (action === "conflict") {
    return { status: "conflict" };
  }

  if (action === "needs_phone") {
    return { status: "needs_phone" };
  }

  let user = byGoogleId;
  if (action === "link_email" && byEmail) {
    user = await prisma.user.update({
      where: { id: byEmail.id },
      data: { googleId: identity.googleId },
      select: {
        id: true,
        role: true,
        phone: true,
        fullName: true,
        googleId: true,
        countryCode: true,
        isVerified: true,
      },
    });
    await logAuthEvent(
      "GOOGLE_LINKED",
      { phone: user.phone, email: identity.email },
      user.id,
    );
  }

  if (!user) {
    return { status: "needs_phone" };
  }

  if (user.role === "MEMBER") {
    const account = await getMemberAccountForUser(user.id);
    if (isMemberSuspended(account)) {
      return { status: "suspended" };
    }
  }

  return {
    status: "ready",
    user: {
      id: user.id,
      role: user.role,
      phone: user.phone,
      fullName: user.fullName,
      countryCode: user.countryCode,
      isVerified: user.isVerified,
    },
  };
}
