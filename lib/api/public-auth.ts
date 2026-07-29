import { NextResponse } from "next/server";
import { createAndSendOtp, verifyOtp } from "@/lib/auth/otp";
import { checkRateLimit, recordFailedAttempt, rateLimitKey } from "@/lib/auth/rate-limit";
import { assertOtpBotAllowed, consumeOtpIpSlot } from "@/lib/auth/signup-guard";
import { shouldBlockAuthBot } from "@/lib/auth/bot-guard";
import { normalizePhone } from "@/lib/auth/validation";
import { z } from "zod";

const sendSchema = z.object({
  phone: z.string().min(10),
  countryCode: z.string().min(2).max(10).optional(),
  purpose: z.enum(["signup", "login", "reset"]).optional(),
  company_website: z.string().optional(),
  ss_hp_field: z.string().optional(),
  turnstileToken: z.string().optional(),
});

const verifySchema = z.object({
  phone: z.string().min(10),
  code: z.string().length(6),
  countryCode: z.string().min(2).max(10).optional(),
  purpose: z.enum(["signup", "login", "reset"]).optional(),
});

const purposeMap = {
  signup: "SIGNUP_VERIFY" as const,
  login: "LOGIN" as const,
  reset: "PASSWORD_RESET" as const,
};

export async function handlePublicSendOtp(request: Request) {
  if (shouldBlockAuthBot(request.headers.get("user-agent"), request.method)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = sendSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
  }

  const phone = normalizePhone(body.data.phone);
  const countryCode = body.data.countryCode ?? "GH";
  const purpose = purposeMap[body.data.purpose ?? "signup"];

  const otpBot = await assertOtpBotAllowed({
    honeypot: body.data.ss_hp_field || body.data.company_website,
    turnstileToken: body.data.turnstileToken,
  });
  if (!otpBot.ok) {
    const status = otpBot.error === "rate_limit" ? 429 : 403;
    return NextResponse.json({ error: "Too many requests" }, { status });
  }

  const otpIp = await consumeOtpIpSlot();
  if (!otpIp.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const limit = await checkRateLimit(rateLimitKey("otp_request", phone));
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.reason, retryAfterSec: limit.retryAfterSec }, { status: 429 });
  }

  const result = await createAndSendOtp(phone, purpose, countryCode);
  if (!result.ok) {
    return NextResponse.json(
      { error: "Cooldown active", cooldownSec: result.cooldownSec },
      { status: 429 },
    );
  }

  return NextResponse.json({ ok: true, message: "OTP sent" });
}

export async function handlePublicVerifyOtp(request: Request) {
  if (shouldBlockAuthBot(request.headers.get("user-agent"), request.method)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = verifySchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const phone = normalizePhone(body.data.phone);
  const purpose = purposeMap[body.data.purpose ?? "signup"];

  const limit = await checkRateLimit(rateLimitKey("otp", phone));
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.reason }, { status: 429 });
  }

  const result = await verifyOtp(phone, body.data.code, purpose);
  if (!result.ok) {
    await recordFailedAttempt(rateLimitKey("otp", phone));
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, verified: true });
}
