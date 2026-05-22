import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "splitsms_reset";
const TTL = "15m";

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function createPasswordResetSession(
  userId: string,
  phone: string,
  returnTo?: string,
) {
  const token = await new SignJWT({
    userId,
    phone,
    purpose: "password_reset",
    returnTo: returnTo ?? "",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TTL)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 15,
  });
}

export async function getPasswordResetSession(): Promise<{
  userId: string;
  phone: string;
  returnTo?: string;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.purpose !== "password_reset") return null;
    const returnTo = payload.returnTo ? String(payload.returnTo) : undefined;
    return {
      userId: String(payload.userId),
      phone: String(payload.phone),
      returnTo: returnTo || undefined,
    };
  } catch {
    return null;
  }
}

export async function clearPasswordResetSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
