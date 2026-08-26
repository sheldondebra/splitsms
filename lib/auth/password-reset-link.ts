import { SignJWT, jwtVerify } from "jose";
import { getSiteUrl } from "@/lib/site-config";

const PURPOSE = "email_password_reset";
const TTL = "1h";

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

/** Signed one-time URL token (opens /reset-password and starts a reset session). */
export async function createPasswordResetLinkToken(userId: string, phone: string) {
  return new SignJWT({
    userId,
    phone,
    purpose: PURPOSE,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TTL)
    .sign(getSecret());
}

export async function verifyPasswordResetLinkToken(
  token: string,
): Promise<{ userId: string; phone: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.purpose !== PURPOSE) return null;
    const userId = String(payload.userId ?? "");
    const phone = String(payload.phone ?? "");
    if (!userId || !phone) return null;
    return { userId, phone };
  } catch {
    return null;
  }
}

export function buildPasswordResetLinkUrl(token: string) {
  return `${getSiteUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}
