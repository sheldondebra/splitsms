import { createHmac, timingSafeEqual } from "crypto";

function secret() {
  return (
    process.env.SESSION_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    "splitsms-newsletter"
  );
}

export function newsletterUnsubscribeToken(email: string) {
  return createHmac("sha256", secret())
    .update(`newsletter:${email.trim().toLowerCase()}`)
    .digest("hex")
    .slice(0, 32);
}

export function newsletterUnsubscribeTokenValid(email: string, token: string) {
  const expected = newsletterUnsubscribeToken(email);
  const got = token.trim().toLowerCase();
  if (got.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(got));
  } catch {
    return false;
  }
}
