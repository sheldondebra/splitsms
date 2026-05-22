import { createHash, randomInt } from "crypto";
import { prisma } from "@/lib/db";
import { sendOtpSms } from "@/lib/sms/otp-sender";
import type { OtpPurpose } from "@/lib/generated/prisma/client";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export function generateOtpCode() {
  return String(randomInt(100000, 999999));
}

export async function getOtpResendCooldownSec(phone: string, purpose: OtpPurpose) {
  const last = await prisma.otpSession.findFirst({
    where: { phone, purpose },
    orderBy: { createdAt: "desc" },
  });
  if (!last) return 0;
  const elapsed = Date.now() - last.createdAt.getTime();
  if (elapsed >= RESEND_COOLDOWN_MS) return 0;
  return Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
}

export async function createAndSendOtp(
  phone: string,
  purpose: OtpPurpose,
  countryCode: string,
  userId?: string,
) {
  const cooldown = await getOtpResendCooldownSec(phone, purpose);
  if (cooldown > 0) {
    return { ok: false as const, error: "cooldown", cooldownSec: cooldown };
  }

  await prisma.otpSession.updateMany({
    where: { phone, purpose, verified: false },
    data: { verified: true },
  });

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.otpSession.create({
    data: {
      phone,
      codeHash: hashCode(code),
      purpose,
      expiresAt,
      userId,
    },
  });

  const message =
    purpose === "PASSWORD_RESET"
      ? `SplitSMS password reset code: ${code}. Valid 10 min. Do not share.`
      : `Your SplitSMS verification code is ${code}. Valid for 10 minutes.`;

  await sendOtpSms(phone, code, countryCode, message);
  return { ok: true as const, expiresAt, cooldownSec: 60 };
}

export async function verifyOtp(phone: string, code: string, purpose: OtpPurpose) {
  const session = await prisma.otpSession.findFirst({
    where: { phone, purpose, verified: false },
    orderBy: { createdAt: "desc" },
  });

  if (!session) return { ok: false as const, error: "No active code. Request a new one." };
  if (session.expiresAt < new Date())
    return { ok: false as const, error: "Code expired. Request a new one." };
  if (session.attempts >= MAX_ATTEMPTS)
    return { ok: false as const, error: "Too many attempts. Request a new code." };

  const valid = session.codeHash === hashCode(code);
  await prisma.otpSession.update({
    where: { id: session.id },
    data: { attempts: { increment: 1 }, verified: valid },
  });

  if (!valid) return { ok: false as const, error: "Invalid code" };
  return { ok: true as const, sessionId: session.id, userId: session.userId };
}
