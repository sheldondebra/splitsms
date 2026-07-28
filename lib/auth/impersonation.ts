import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";

export const IMPERSONATE_COOKIE = "splitsms_impersonate";

export type ImpersonationPayload = {
  adminUserId: string;
  targetUserId: string;
  targetPhone: string;
  kind: "reseller" | "staff";
  resellerId?: string;
  businessName?: string;
  targetRole?: "ADMIN" | "SUPER_ADMIN";
  targetName?: string;
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

export async function setImpersonationCookie(payload: ImpersonationPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("4h")
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATE_COOKIE, token, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 4,
  });
}

export async function clearImpersonationCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATE_COOKIE);
}

export const readImpersonationCookie = cache(
  async (): Promise<ImpersonationPayload | null> => {
    const cookieStore = await cookies();
    const token = cookieStore.get(IMPERSONATE_COOKIE)?.value;
    if (!token) return null;
    try {
      const { payload } = await jwtVerify(token, getSecret());
      const data = payload as unknown as ImpersonationPayload;
      if (!data.adminUserId || !data.targetUserId) return null;
      if (data.kind === "staff") {
        if (!data.targetRole || !data.targetName) return null;
        return data;
      }
      if (!data.resellerId) return null;
      return { ...data, kind: data.kind ?? "reseller" };
    } catch {
      return null;
    }
  },
);

/** Edge-safe verify for middleware (no next/headers). */
export async function verifyImpersonationToken(
  token: string | undefined,
): Promise<ImpersonationPayload | null> {
  if (!token) return null;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const data = payload as unknown as ImpersonationPayload;
    if (!data.adminUserId || !data.targetUserId) return null;
    if (data.kind === "staff") {
      if (!data.targetRole || !data.targetName) return null;
      return data;
    }
    if (!data.resellerId) return null;
    return { ...data, kind: data.kind ?? "reseller" };
  } catch {
    return null;
  }
}
