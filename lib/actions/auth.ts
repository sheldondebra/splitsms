"use server";

import { DEFAULT_COUNTRY_CODE } from "@/lib/constants/defaults";
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
  phoneAuthSchema,
  emailAuthLoginSchema,
  emailAuthSignupSchema,
  completeProfileSchema,
  normalizePhone,
  normalizePhoneWithCountry,
} from "@/lib/auth/validation";
import {
  generateOtpOnlyPassword,
  PLACEHOLDER_PROFILE_NAME,
  userNeedsProfileCompletion,
  maskPhoneForDisplay,
} from "@/lib/auth/phone-auth";
import { getSession } from "@/lib/auth/session";
import { isMailjetConfigured } from "@/lib/email/config";
import type { OtpDeliveryChannel } from "@/lib/auth/otp";
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
import { getMemberAccountForUser, isMemberSuspended } from "@/lib/admin/member-account";
import { assertTenantLoginAllowed } from "@/lib/auth/tenant-login";
import {
  assertOtpRequestAllowed,
  assertSignupAllowed,
  readSignupGuardFields,
} from "@/lib/auth/signup-guard";
import { redirect } from "next/navigation";
import type { OtpPurpose, UserRole } from "@/lib/generated/prisma/client";

function authRedirect(path: string, params?: Record<string, string>): never {
  const q = params ? `?${new URLSearchParams(params).toString()}` : "";
  redirect(`${path}${q}`);
}

function passwordLoginRedirect(params?: Record<string, string>): never {
  authRedirect("/login", { ...params });
}

function passwordLoginRedirectPhone(params?: Record<string, string>): never {
  authRedirect("/login", { phone: "1", ...params });
}

function emailOtpDelivery(email: string): {
  email: string;
  channel: OtpDeliveryChannel;
} {
  return {
    email,
    channel: isMailjetConfigured() ? "email" : "sms",
  };
}

function verifyOtpParamsForEmailFlow(
  phone: string,
  purpose: string,
  countryCode: string,
  email: string,
  delivery: OtpDeliveryChannel,
) {
  const sentToEmail = delivery === "email" || delivery === "both";
  return {
    phone,
    purpose,
    country: countryCode,
    via: "email",
    delivery: sentToEmail ? "email" : "sms",
    hint: encodeURIComponent(sentToEmail ? email : maskPhoneForDisplay(phone)),
  };
}

async function finishLogin(user: {
  id: string;
  role: UserRole;
  phone: string;
}) {
  await assertTenantLoginAllowed(user.id, user.role);

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

async function grantWelcomeCredits(userId: string) {
  await prisma.smsCredit.updateMany({
    where: { userId, balance: 0 },
    data: { balance: 5 },
  });
}

/** Unified phone login / signup — sends OTP, creates account if new */
export async function requestPhoneAuthAction(formData: FormData) {
  const intent = String(formData.get("intent") ?? "login");
  const returnPath = intent === "signup" ? "/signup" : "/login";
  const guardFields = readSignupGuardFields(formData);

  const otpGuard = await assertOtpRequestAllowed(guardFields);
  if (!otpGuard.ok) {
    authRedirect(returnPath, { error: "rate_limit" });
  }

  const parsed = phoneAuthSchema.safeParse({
    phone: formData.get("phone"),
    countryCode: formData.get("countryCode") ?? DEFAULT_COUNTRY_CODE,
    dialCode: formData.get("dialCode") ?? "+233",
  });

  if (!parsed.success) {
    authRedirect(returnPath, { error: "invalid_phone" });
  }

  const { countryCode, dialCode } = parsed.data;
  const phone = normalizePhoneWithCountry(parsed.data.phone, dialCode, countryCode);

  const phoneCheck = phone.length >= 10 ? { success: true as const } : { success: false as const };
  if (!phoneCheck.success) {
    authRedirect(returnPath, { error: "invalid_phone" });
  }

  const limit = await checkRateLimit(rateLimitKey("otp_request", phone));
  if (!limit.allowed) {
    authRedirect(returnPath, { error: "rate_limit" });
  }

  let user = await prisma.user.findUnique({ where: { phone } });
  let otpPurpose: OtpPurpose = "LOGIN";
  let purposeParam = "login";

  if (!user) {
    const signupGuard = await assertSignupAllowed(guardFields);
    if (!signupGuard.ok) {
      authRedirect(returnPath, { error: "rate_limit" });
    }

    const passwordHash = await hashPassword(generateOtpOnlyPassword());
    user = await prisma.user.create({
      data: {
        fullName: PLACEHOLDER_PROFILE_NAME,
        phone,
        countryCode,
        passwordHash,
        wallet: { create: { currency: countryCode === "GH" ? "GHS" : "USD" } },
        smsCredit: { create: { balance: 0 } },
        memberAccount: { create: {} },
      },
    });
    otpPurpose = "SIGNUP_VERIFY";
    purposeParam = "signup";
    const country = getCountryByCode(countryCode);
    await logAuthEvent(
      "SIGNUP_STARTED",
      { phone, signupMethod: "phone_otp", countryCode, smsProvider: country?.defaultProvider },
      user.id,
    );
  } else {
    if (user.role === "MEMBER") {
      const account = await getMemberAccountForUser(user.id);
      if (isMemberSuspended(account)) {
        authRedirect(returnPath, { error: "suspended" });
      }
    }

    if (!user.isVerified) {
      otpPurpose = "SIGNUP_VERIFY";
      purposeParam = "signup";
    } else {
      otpPurpose = "LOGIN";
      purposeParam = "login";
    }
  }

  const otp = await createAndSendOtp(phone, otpPurpose, countryCode, user.id);
  if (!otp.ok) {
    authRedirect(returnPath, {
      error: "otp_cooldown",
      cooldown: String(otp.cooldownSec),
    });
  }

  authRedirect("/verify-otp", {
    phone,
    purpose: purposeParam,
    country: countryCode,
  });
}

/** Email login / signup — OTP via Mailjet when configured, else SMS to phone */
export async function requestEmailAuthAction(formData: FormData) {
  const intent = String(formData.get("intent") ?? "login");
  const returnPath = intent === "signup" ? "/signup" : "/login";

  if (intent === "signup") {
    const guardFields = readSignupGuardFields(formData);

    const otpGuard = await assertOtpRequestAllowed(guardFields);
    if (!otpGuard.ok) {
      authRedirect(returnPath, { error: "rate_limit", method: "email" });
    }

    const signupGuard = await assertSignupAllowed(guardFields);
    if (!signupGuard.ok) {
      authRedirect(returnPath, { error: "rate_limit", method: "email" });
    }

    const parsed = emailAuthSignupSchema.safeParse({
      email: formData.get("email"),
      phone: formData.get("phone"),
      countryCode: formData.get("countryCode") ?? DEFAULT_COUNTRY_CODE,
      dialCode: formData.get("dialCode") ?? "+233",
    });

    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path[0];
      authRedirect(returnPath, {
        error: field === "email" ? "email" : "invalid_phone",
        method: "email",
      });
    }

    const { email, countryCode, dialCode } = parsed.data;
    const phone = normalizePhoneWithCountry(parsed.data.phone, dialCode, countryCode);

    if (phone.length < 10) {
      authRedirect(returnPath, { error: "invalid_phone", method: "email" });
    }

    const limit = await checkRateLimit(rateLimitKey("otp_request", phone));
    if (!limit.allowed) {
      authRedirect(returnPath, { error: "rate_limit", method: "email" });
    }

    const [existingPhone, existingEmail] = await Promise.all([
      prisma.user.findUnique({ where: { phone } }),
      prisma.user.findUnique({ where: { email } }),
    ]);

    if (existingPhone) {
      authRedirect(returnPath, { error: "exists", method: "email" });
    }
    if (existingEmail) {
      authRedirect(returnPath, { error: "email_taken", method: "email" });
    }

    const passwordHash = await hashPassword(generateOtpOnlyPassword());
    const user = await prisma.user.create({
      data: {
        fullName: PLACEHOLDER_PROFILE_NAME,
        phone,
        email,
        countryCode,
        passwordHash,
        wallet: { create: { currency: countryCode === "GH" ? "GHS" : "USD" } },
        smsCredit: { create: { balance: 0 } },
        memberAccount: { create: {} },
      },
    });

    const country = getCountryByCode(countryCode);
    await logAuthEvent(
      "SIGNUP_STARTED",
      { phone, email, signupMethod: "email_otp", countryCode, smsProvider: country?.defaultProvider },
      user.id,
    );

    const deliveryOpts = emailOtpDelivery(email);

    let otp;
    try {
      otp = await createAndSendOtp(phone, "SIGNUP_VERIFY", countryCode, user.id, deliveryOpts);
    } catch {
      authRedirect(returnPath, { error: "email_send", method: "email" });
    }

    if (!otp.ok) {
      authRedirect(returnPath, {
        error: "otp_cooldown",
        cooldown: String(otp.cooldownSec),
        method: "email",
      });
    }

    authRedirect(
      "/verify-otp",
      verifyOtpParamsForEmailFlow(phone, "signup", countryCode, email, otp.delivery),
    );
    return;
  }

  const parsed = emailAuthLoginSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    authRedirect(returnPath, { error: "email", method: "email" });
  }

  const email = parsed.data.email;
  const limit = await checkRateLimit(rateLimitKey("otp_request", email));
  if (!limit.allowed) {
    authRedirect(returnPath, { error: "rate_limit", method: "email" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    authRedirect(returnPath, { error: "email_not_found", method: "email" });
  }

  if (user!.role === "MEMBER") {
    const account = await getMemberAccountForUser(user!.id);
    if (isMemberSuspended(account)) {
      authRedirect(returnPath, { error: "suspended", method: "email" });
    }
  }

  const otpPurpose: OtpPurpose = user!.isVerified ? "LOGIN" : "SIGNUP_VERIFY";
  const purposeParam = user!.isVerified ? "login" : "signup";

  const loginEmail = email;
  const deliveryOpts = emailOtpDelivery(loginEmail);

  let otp;
  try {
    otp = await createAndSendOtp(
      user!.phone,
      otpPurpose,
      user!.countryCode,
      user!.id,
      deliveryOpts,
    );
  } catch {
    authRedirect(returnPath, { error: "email_send", method: "email" });
  }

  if (!otp.ok) {
    authRedirect(returnPath, {
      error: "otp_cooldown",
      cooldown: String(otp.cooldownSec),
      method: "email",
    });
  }

  authRedirect(
    "/verify-otp",
    verifyOtpParamsForEmailFlow(
      user!.phone,
      purposeParam,
      user!.countryCode,
      loginEmail,
      otp.delivery,
    ),
  );
}

export async function completeProfileAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const parsed = completeProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email") ?? "",
  });

  if (!parsed.success) {
    authRedirect("/complete-profile", { error: "name" });
  }

  const { fullName, email } = parsed.data;

  if (email) {
    const taken = await prisma.user.findFirst({
      where: { email, id: { not: session.userId } },
    });
    if (taken) {
      authRedirect("/complete-profile", { error: "email_taken" });
    }
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      fullName,
      ...(email ? { email } : {}),
    },
  });

  await logAuthEvent("PROFILE_COMPLETED", { phone: session.phone }, session.userId);

  if (session.role === "ADMIN" || session.role === "SUPER_ADMIN") {
    redirect("/admin");
  }
  if (session.role === "RESELLER") {
    redirect("/reseller");
  }
  if (session.role === "ENTERPRISE") {
    redirect("/enterprise");
  }
  redirect("/dashboard");
}

export async function signupAction(formData: FormData) {
  const signupMethod = String(formData.get("signupMethod") ?? "phone");
  const dialCode = String(formData.get("dialCode") ?? "+233");
  const countryCode = String(formData.get("countryCode") ?? DEFAULT_COUNTRY_CODE).toUpperCase();
  const guardFields = readSignupGuardFields(formData);

  const otpGuard = await assertOtpRequestAllowed(guardFields);
  if (!otpGuard.ok) {
    authRedirect("/signup", { error: "rate_limit", method: signupMethod });
  }

  const signupGuard = await assertSignupAllowed(guardFields);
  if (!signupGuard.ok) {
    authRedirect("/signup", { error: "rate_limit", method: signupMethod });
  }

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
      smsCredit: { create: { balance: 0 } },
      memberAccount: { create: {} },
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

  if (otpPurpose === "SIGNUP_VERIFY") {
    await grantWelcomeCredits(user!.id);
  }

  await logAuthEvent("PHONE_VERIFIED", { phone }, user!.id);

  if (userNeedsProfileCompletion(user!.fullName)) {
    await assertTenantLoginAllowed(user!.id, user!.role);
    await createSession({
      userId: user!.id,
      role: user!.role,
      phone: user!.phone,
    });
    await recordDeviceSession(user!.id);
    redirect("/complete-profile");
  }

  await finishLogin(user!);
}

export async function loginPasswordAction(formData: FormData) {
  const emailRaw = String(formData.get("email") ?? "").trim().toLowerCase();
  const identifierRaw = String(
    formData.get("identifier") ?? formData.get("phone") ?? "",
  ).trim();
  const identifier = emailRaw || identifierRaw;
  const usePhoneForm = Boolean(identifierRaw && !emailRaw);

  const parsed = loginSchema.safeParse({
    identifier,
    password: formData.get("password"),
  });

  if (!parsed.success) {
    if (usePhoneForm) passwordLoginRedirectPhone({ error: "invalid" });
    passwordLoginRedirect({ error: "invalid", ...(emailRaw ? { email: emailRaw } : {}) });
  }

  const { password } = parsed.data;
  const limit = await checkRateLimit(rateLimitKey("login", identifier));
  if (!limit.allowed) {
    const rateParams = {
      error: "rate_limit",
      retry: String(limit.retryAfterSec),
      ...(emailRaw ? { email: emailRaw } : {}),
    };
    if (usePhoneForm) passwordLoginRedirectPhone(rateParams);
    passwordLoginRedirect(rateParams);
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
    if (usePhoneForm) passwordLoginRedirectPhone({ error: "invalid" });
    passwordLoginRedirect({
      error: "invalid",
      ...(emailRaw ? { email: emailRaw } : {}),
    });
  }

  if (isAccountLocked(user.lockedUntil)) {
    if (usePhoneForm) passwordLoginRedirectPhone({ error: "locked" });
    passwordLoginRedirect({ error: "locked", ...(emailRaw ? { email: emailRaw } : {}) });
  }

  if (user.role === "MEMBER") {
    const account = await getMemberAccountForUser(user.id);
    if (isMemberSuspended(account)) {
      if (usePhoneForm) passwordLoginRedirectPhone({ error: "suspended" });
      passwordLoginRedirect({ error: "suspended", ...(emailRaw ? { email: emailRaw } : {}) });
    }
  }

  if (!user.isVerified) {
    const otp = await createAndSendOtp(
      user.phone,
      "SIGNUP_VERIFY",
      user.countryCode,
      user.id,
    );
    if (!otp.ok) {
      if (usePhoneForm) passwordLoginRedirectPhone({ error: "otp_cooldown" });
      passwordLoginRedirect({ error: "otp_cooldown", ...(emailRaw ? { email: emailRaw } : {}) });
    }
    authRedirect("/verify-otp", { phone: user.phone, purpose: "signup" });
  }

  await finishLogin(user);
}

export async function loginOtpRequestAction(formData: FormData) {
  const identifier = String(formData.get("identifier") ?? formData.get("phone") ?? "").trim();
  if (identifier.length < 3) authRedirect("/login", { error: "required" });

  const limit = await checkRateLimit(rateLimitKey("otp_request", identifier));
  if (!limit.allowed) authRedirect("/login", { error: "rate_limit" });

  const user = await findUserByIdentifier(identifier);
  if (!user) {
    authRedirect("/login", { error: "invalid" });
  }

  const phone = user!.phone;
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
    const useEmail = Boolean(user.email && isMailjetConfigured());
    const deliveryOpts = useEmail && user.email ? emailOtpDelivery(user.email) : undefined;

    try {
      const otp = await createAndSendOtp(
        user.phone,
        "PASSWORD_RESET",
        user.countryCode,
        user.id,
        deliveryOpts,
      );
      if (!otp.ok) {
        authRedirect("/forgot-password", {
          error: "cooldown",
          cooldown: String(otp.cooldownSec),
        });
      }
      await logAuthEvent("PASSWORD_RESET_REQUESTED", { phone: user.phone }, user.id);
      authRedirect("/verify-otp", {
        phone: user.phone,
        purpose: "reset",
        ...(useEmail && user.email
          ? {
              delivery: "email",
              hint: encodeURIComponent(user.email),
            }
          : {}),
      });
    } catch {
      authRedirect("/forgot-password", { error: "email_send" });
    }
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

  const countryCode = String(formData.get("countryCode") ?? DEFAULT_COUNTRY_CODE).toUpperCase();
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
