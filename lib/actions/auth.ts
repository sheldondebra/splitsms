"use server";

import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createAndSendOtp, verifyOtp } from "@/lib/auth/otp";
import { createSession, clearSession } from "@/lib/auth/session";
import { recordDeviceSession } from "@/lib/auth/device-session";
import {
  signupSchema,
  loginSchema,
  otpCodeSchema,
  resetPasswordSchema,
  normalizePhone,
  normalizePhoneWithCountry,
} from "@/lib/auth/validation";
import { getCountryByCode } from "@/lib/countries-data";
import {
  findUserByIdentifier,
  isAccountLocked,
} from "@/lib/auth/user-lookup";
import {
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
  rateLimitKey,
} from "@/lib/auth/rate-limit";
import {
  createPasswordResetSession,
  getPasswordResetSession,
  clearPasswordResetSession,
} from "@/lib/auth/reset-session";
import { logAuthEvent } from "@/lib/auth/audit";
import { redirect } from "next/navigation";
import type { OtpPurpose, UserRole } from "@/lib/generated/prisma/client";

function authRedirect(path: string, params?: Record<string, string>): never {
  const q = params ? `?${new URLSearchParams(params).toString()}` : "";
  redirect(`${path}${q}`);
}

async function finishLogin(user: {
  id: string;
  role: UserRole;
  phone: string;
}) {
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null },
  });
  await clearRateLimit(rateLimitKey("login", user.phone));
  await createSession({
    userId: user.id,
    role: user.role,
    phone: user.phone,
  });
  await recordDeviceSession(user.id);
  await logAuthEvent("LOGIN_SUCCESS", { phone: user.phone }, user.id);
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    redirect("/admin");
  }
  if (user.role === "RESELLER") {
    redirect("/reseller");
  }
  if (user.role === "ENTERPRISE") {
    redirect("/enterprise");
  }
  redirect("/dashboard");
}

export async function signupAction(formData: FormData) {
  const signupMethod = String(formData.get("signupMethod") ?? "phone");
  const dialCode = String(formData.get("dialCode") ?? "+233");
  const countryCode = String(formData.get("countryCode") ?? "GH").toUpperCase();

  const parsed = signupSchema.safeParse({
    signupMethod,
    fullName: formData.get("fullName"),
    countryCode,
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    referralCode: formData.get("referralCode") || undefined,
  });

  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0] ?? "invalid";
    authRedirect("/signup", { error: String(field), method: signupMethod });
  }

  const { fullName, password, referralCode } = parsed.data;
  const phone = normalizePhoneWithCountry(
    parsed.data.phone,
    dialCode,
    countryCode,
  );

  const email =
    parsed.data.signupMethod === "email"
      ? parsed.data.email
      : "email" in parsed.data
        ? parsed.data.email
        : undefined;

  const ipKey = rateLimitKey("signup", phone);
  const limit = await checkRateLimit(ipKey);
  if (!limit.allowed) {
    authRedirect("/signup", { error: "rate_limit", method: signupMethod });
  }

  const existingPhone = await prisma.user.findUnique({ where: { phone } });
  if (existingPhone) {
    authRedirect("/signup", { error: "exists", method: signupMethod });
  }

  if (email) {
    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken) {
      authRedirect("/signup", { error: "email_taken", method: signupMethod });
    }
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      fullName,
      phone,
      countryCode,
      passwordHash,
      referralCode,
      email: email || undefined,
      wallet: { create: { currency: countryCode === "GH" ? "GHS" : "USD" } },
      smsCredit: { create: { balance: 5 } },
    },
  });

  const otp = await createAndSendOtp(phone, "SIGNUP_VERIFY", countryCode, user.id);
  if (!otp.ok) {
    authRedirect("/signup", {
      error: "otp_cooldown",
      cooldown: String(otp.cooldownSec),
      method: signupMethod,
    });
  }

  const country = getCountryByCode(countryCode);
  await logAuthEvent("SIGNUP_STARTED", {
    phone,
    signupMethod: parsed.data.signupMethod,
    countryCode,
    smsProvider: country?.defaultProvider,
  }, user.id);

  authRedirect("/verify-otp", {
    phone,
    purpose: "signup",
    country: countryCode,
  });
}

export async function verifyOtpAction(formData: FormData) {
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const code = String(formData.get("code") ?? "").trim();
  const purpose = (String(formData.get("purpose") ?? "signup") as string).toUpperCase();

  const purposeMap: Record<string, OtpPurpose> = {
    SIGNUP: "SIGNUP_VERIFY",
    SIGNUP_VERIFY: "SIGNUP_VERIFY",
    LOGIN: "LOGIN",
    RESET: "PASSWORD_RESET",
    PASSWORD_RESET: "PASSWORD_RESET",
  };
  const otpPurpose = purposeMap[purpose] ?? "SIGNUP_VERIFY";

  const codeParsed = otpCodeSchema.safeParse(code);
  if (!codeParsed.success) {
    authRedirect("/verify-otp", { phone, purpose: purpose.toLowerCase(), error: "invalid_code" });
  }

  const limit = await checkRateLimit(rateLimitKey("otp", phone));
  if (!limit.allowed) {
    authRedirect("/verify-otp", {
      phone,
      purpose: purpose.toLowerCase(),
      error: "rate_limit",
    });
  }

  const result = await verifyOtp(phone, codeParsed.data, otpPurpose);
  if (!result.ok) {
    await recordFailedAttempt(rateLimitKey("otp", phone));
    authRedirect("/verify-otp", {
      phone,
      purpose: purpose.toLowerCase(),
      error: "otp",
      msg: encodeURIComponent(result.error),
    });
  }

  await clearRateLimit(rateLimitKey("otp", phone));

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    authRedirect("/verify-otp", { phone, purpose: purpose.toLowerCase(), error: "user" });
  }

  if (otpPurpose === "PASSWORD_RESET") {
    const returnTo = String(formData.get("returnTo") ?? "").trim();
    const safeReturn = returnTo.startsWith("/dashboard") ? returnTo : undefined;
    await createPasswordResetSession(user!.id, phone, safeReturn);
    await logAuthEvent("PASSWORD_RESET_OTP_VERIFIED", { phone }, user!.id);
    redirect("/reset-password");
  }

  if (otpPurpose === "LOGIN") {
    await finishLogin(user!);
  }

  await prisma.user.update({
    where: { id: user!.id },
    data: { isVerified: true, failedLoginCount: 0, lockedUntil: null },
  });

  await logAuthEvent("PHONE_VERIFIED", { phone }, user!.id);
  await finishLogin(user!);
}

export async function loginPasswordAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("phone"),
    password: formData.get("password"),
  });

  if (!parsed.success) authRedirect("/login", { error: "invalid" });

  const { identifier, password } = parsed.data;
  const limit = await checkRateLimit(rateLimitKey("login", identifier));
  if (!limit.allowed) {
    authRedirect("/login", { error: "rate_limit", retry: String(limit.retryAfterSec) });
  }

  const user = await findUserByIdentifier(identifier);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    await recordFailedAttempt(rateLimitKey("login", identifier));
    if (user) {
      const count = user.failedLoginCount + 1;
      const lockedUntil =
        count >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : user.lockedUntil;
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: count, lockedUntil },
      });
    }
    await logAuthEvent("LOGIN_FAILED", { identifier });
    authRedirect("/login", { error: "invalid" });
  }

  if (isAccountLocked(user.lockedUntil)) {
    authRedirect("/login", { error: "locked" });
  }

  if (!user.isVerified) {
    const otp = await createAndSendOtp(
      user.phone,
      "SIGNUP_VERIFY",
      user.countryCode,
      user.id,
    );
    if (!otp.ok) {
      authRedirect("/login", { error: "otp_cooldown" });
    }
    authRedirect("/verify-otp", { phone: user.phone, purpose: "signup" });
  }

  await finishLogin(user);
}

export async function loginOtpRequestAction(formData: FormData) {
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  if (phone.length < 10) authRedirect("/login", { error: "invalid_phone" });

  const limit = await checkRateLimit(rateLimitKey("otp_request", phone));
  if (!limit.allowed) authRedirect("/login", { error: "rate_limit" });

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    authRedirect("/login", { error: "invalid" });
  }

  const otp = await createAndSendOtp(phone, "LOGIN", user!.countryCode, user!.id);
  if (!otp.ok) {
    authRedirect("/login", { error: "otp_cooldown", cooldown: String(otp.cooldownSec) });
  }

  authRedirect("/verify-otp", { phone, purpose: "login" });
}

export async function forgotPasswordAction(formData: FormData) {
  const identifier = String(formData.get("identifier") ?? "").trim();
  if (!identifier) authRedirect("/forgot-password", { error: "required" });

  const limit = await checkRateLimit(rateLimitKey("forgot", identifier));
  if (!limit.allowed) {
    authRedirect("/forgot-password", { error: "rate_limit" });
  }

  const user = await findUserByIdentifier(identifier);

  if (user && !isAccountLocked(user.lockedUntil)) {
    const otp = await createAndSendOtp(
      user.phone,
      "PASSWORD_RESET",
      user.countryCode,
      user.id,
    );
    if (!otp.ok) {
      authRedirect("/forgot-password", {
        error: "cooldown",
        cooldown: String(otp.cooldownSec),
      });
    }
    await logAuthEvent("PASSWORD_RESET_REQUESTED", { phone: user.phone }, user.id);
    authRedirect("/verify-otp", { phone: user.phone, purpose: "reset" });
  }

  authRedirect("/forgot-password", { sent: "1" });
}

export async function resetPasswordAction(formData: FormData) {
  const reset = await getPasswordResetSession();
  if (!reset) redirect("/forgot-password?error=session");

  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    authRedirect("/reset-password", { error: "weak_password" });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.update({
    where: { id: reset.userId },
    data: {
      passwordHash,
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });

  await clearPasswordResetSession();
  await clearRateLimit(rateLimitKey("login", reset.phone));
  await logAuthEvent("PASSWORD_RESET_COMPLETED", { phone: reset.phone }, reset.userId);

  if (reset.returnTo?.startsWith("/dashboard")) {
    redirect(`${reset.returnTo}?password=updated`);
  }

  authRedirect("/login", { reset: "success" });
}

export async function resendOtpAction(formData: FormData) {
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const purposeRaw = String(formData.get("purpose") ?? "signup").toUpperCase();
  const purposeMap: Record<string, OtpPurpose> = {
    SIGNUP: "SIGNUP_VERIFY",
    LOGIN: "LOGIN",
    RESET: "PASSWORD_RESET",
    PASSWORD_RESET: "PASSWORD_RESET",
  };
  const purpose = purposeMap[purposeRaw] ?? "SIGNUP_VERIFY";

  const countryCode = String(formData.get("countryCode") ?? "GH").toUpperCase();
  const user = await prisma.user.findUnique({ where: { phone } });
  const otp = await createAndSendOtp(
    phone,
    purpose,
    user?.countryCode ?? countryCode,
    user?.id,
  );

  const purposeParam = purposeRaw.toLowerCase().replace("_verify", "").replace("password_", "reset");
  if (!otp.ok) {
    authRedirect("/verify-otp", {
      phone,
      purpose: purposeParam === "signup_verify" ? "signup" : purposeParam,
      error: "cooldown",
      cooldown: String(otp.cooldownSec),
    });
  }

  authRedirect("/verify-otp", {
    phone,
    purpose: purpose === "SIGNUP_VERIFY" ? "signup" : purpose === "LOGIN" ? "login" : "reset",
    resent: "1",
  });
}

export async function logoutAction() {
  const session = await import("@/lib/auth/session").then((m) => m.getSession());
  if (session) {
    await logAuthEvent("LOGOUT", { phone: session.phone }, session.userId);
  }
  await clearSession();
  redirect("/login");
}
