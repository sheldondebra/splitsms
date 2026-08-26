import { SignJWT, jwtVerify } from "jose";
import { getSiteUrl } from "@/lib/site-config";

const PURPOSE = "sender_id_document_upload";
const TTL = "7d";

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

/** Signed link tied to one member + one Sender ID (opens /sender-id/verify). */
export async function createSenderIdVerificationToken(userId: string, senderId: string) {
  return new SignJWT({
    userId,
    senderId,
    purpose: PURPOSE,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TTL)
    .sign(getSecret());
}

export async function verifySenderIdVerificationToken(
  token: string,
): Promise<{ userId: string; senderId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.purpose !== PURPOSE) return null;
    const userId = String(payload.userId ?? "");
    const senderId = String(payload.senderId ?? "");
    if (!userId || !senderId) return null;
    return { userId, senderId };
  } catch {
    return null;
  }
}

export function buildSenderIdVerificationUrl(token: string) {
  return `${getSiteUrl()}/sender-id/verify?token=${encodeURIComponent(token)}`;
}
