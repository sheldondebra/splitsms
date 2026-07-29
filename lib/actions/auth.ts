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
  phoneAuthSignupSchema,
  emailAuthLoginSchema,
  emailAuthSignupSchema,
  completeProfileSchema,
  normalizePhone,
  normalizePhoneWithCountry,
} from "@/lib/auth/validation";
import {
  PLACEHOLDER_PROFILE_NAME,
  userNeedsProfileCompletion,
  maskPhoneForDisplay,
} from "@/lib/auth/phone-auth";
import { generateUniqueAccountNumber } from "@/lib/auth/account-number";
import { getSession } from "@/lib/auth/session";
import { isEmailConfiguredAsync } from "@/lib/email/config";
import { sendEmail } from "@/lib/email";
import { accountWelcomeEmailContent } from "@/lib/email/templates";
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
import { userNeedsOnboarding } from "@/lib/onboarding";
import { assertTenantLoginAllowed } from "@/lib/auth/tenant-login";
import {
  assertOtpBotAllowed,
  assertSignupBotAllowed,
  consumeOtpIpSlot,
  consumeSignupIpSlot,
  readSignupGuardFields,
  type AuthGuardError,
} from "@/lib/auth/signup-guard";
import {
  isResellerLinkedUser,
  linkSignupUserToReseller,
  resolveResellerInvite,
} from "@/lib/reseller/invite";
import { getRequestTenant } from "@/lib/reseller/request-tenant";
import { redirect } from "next/navigation";
import type { OtpPurpose, UserRole } from "@/lib/generated/prisma/client";

function inviteRedirectParams(formData: FormData): Record<string, string> {
  const r = String(formData.get("resellerInvite") ?? "").trim();
  return r ? { r } : {};
}

function authRedirect(path: string, params?: Record<string, string>): never {
  const q = params ? `?${new URLSearchParams(params).toString()}` : "";
  redirect(`${path}${q}`);
}

function guardErrorParams(
  error: AuthGuardError,
  extra?: Record<string, string>,
): Record<string, string> {
  return { error, ...extra };
}

/** Safe post-login redirect for Slack admin links and admin pages only. */
function parseSafeReturnTo(raw: string | undefined | null): string | null {
  const value = raw?.trim();
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith("/slack/action") || value.startsWith("/slack/go")) return value;
  if (value.startsWith("/admin")) return value;
  return null;
}

function passwordLoginRedirect(params?: Record<string, string>): never {
  authRedirect("/login", { ...params });
}

function passwordLoginRedirectPhone(params?: Record<string, string>): never {
  authRedirect("/login", { mode: "password", phone: "1", ...params });
}

function otpLoginRedirect(params?: Record<string, string>): never {
  authRedirect("/login", { mode: "sms", ...params });
}

async function emailOtpDelivery(email: string): Promise<{
  email: string;
  channel: OtpDeliveryChannel;
}> {
  return {
    email,
    channel: (await isEmailConfiguredAsync()) ? "email" : "sms",
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

async function finishLogin(
  user: {
    id: string;
    role: UserRole;
    phone: string;
  },
  returnTo?: string | null,
) {
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

  const safeReturn = parseSafeReturnTo(returnTo);
  if (safeReturn && (user.role === "ADMIN" || user.role === "SUPER_ADMIN")) {
    redirect(safeReturn);
  }

  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    redirect("/admin");
  }
  if (user.role === "RESELLER") {
    redirect("/reseller");
  }
  if (user.role === "ENTERPRISE") {
    redirect("/enterprise");
  }
  if (user.role === "MEMBER" && (await userNeedsOnboarding(user.id))) {
    redirect("/onboarding");
  }
  redirect("/dashboard");
}

async function grantWelcomeCredits(userId: string) {
  if (await isResellerLinkedUser(userId)) return;
  await prisma.smsCredit.updateMany({
    where: { userId, balance: 0 },
    data: { balance: 5 },
  });
}

async function sendWelcomeEmailIfAvailable(user: {
  id: string;
  fullName: string;
  email?: string | null;
}) {
  const email = user.email?.trim().toLowerCase();
  if (!email) return;
  if (!(await isEmailConfiguredAsync())) return;

  const { subject, text, html } = accountWelcomeEmailContent({
    memberName: user.fullName,
  });
  await sendEmail({
    to: email,
    toName: user.fullName,
    subject,
    text,
    html,
  }).catch(() => undefined);
}

async function attachResellerInviteFromForm(userId: string, formData: FormData) {
  const tenant = await getRequestTenant();
  const inviteParam = String(formData.get("resellerInvite") ?? "").trim();
  const resellerId = tenant?.resellerId ?? (await resolveResellerInvite(inviteParam))?.resellerId;
  if (!resellerId) return;
  const source = tenant ? "domain" : "share";
  await linkSignupUserToReseller(userId, resellerId, source);
}

/** Unified phone login / signup — sends OTP, creates account if new */
export async function requestPhoneAuthAction(formData: FormData) {
  const intent = String(formData.get("intent") ?? "login");
  const returnPath = intent === "signup" ? "/signup" : "/login";
  const inviteParams = intent === "signup" ? inviteRedirectParams(formData) : {};
  const guardFields = readSignupGuardFields(formData);

  const otpBot = await assertOtpBotAllowed(guardFields);
  if (!otpBot.ok) {
    authRedirect(returnPath, guardErrorParams(otpBot.error, inviteParams));
  }

  if (intent === "signup") {
    const signupBot = await assertSignupBotAllowed(guardFields);
    if (!signupBot.ok) {
      authRedirect(returnPath, guardErrorParams(signupBot.error, inviteParams));
    }
  }

  const parsed =
    intent === "signup"
      ? phoneAuthSignupSchema.safeParse({
          phone: formData.get("phone"),
          countryCode: formData.get("countryCode") ?? DEFAULT_COUNTRY_CODE,
          dialCode: formData.get("dialCode") ?? "+233",
          password: formData.get("password"),
          confirmPassword: formData.get("confirmPassword"),
        })
      : phoneAuthSchema.safeParse({
          phone: formData.get("phone"),
          countryCode: formData.get("countryCode") ?? DEFAULT_COUNTRY_CODE,
          dialCode: formData.get("dialCode") ?? "+233",
        });

  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    if (field === "password") {
      authRedirect(returnPath, { error: "password", ...inviteParams });
    }
    if (field === "confirmPassword") {
      authRedirect(returnPath, { error: "confirmPassword", ...inviteParams });
    }
    authRedirect(returnPath, { error: "invalid_phone", ...inviteParams });
  }

  const { countryCode, dialCode } = parsed.data;
  const phone = normalizePhoneWithCountry(parsed.data.phone, dialCode, countryCode);
  const signupPassword =
    intent === "signup" && "password" in parsed.data
      ? parsed.data.password
      : null;

  if (phone.length < 10) {
    authRedirect(returnPath, { error: "invalid_phone", ...inviteParams });
  }

  const otpIp = await consumeOtpIpSlot();
  if (!otpIp.ok) {
    authRedirect(returnPath, guardErrorParams(otpIp.error, inviteParams));
  }

  const limit = await checkRateLimit(rateLimitKey("otp_request", phone));
  if (!limit.allowed) {
    authRedirect(returnPath, { error: "rate_limit", ...inviteParams });
  }

  let user = await prisma.user.findUnique({ where: { phone } });
  let otpPurpose: OtpPurpose = "LOGIN";
  let purposeParam = "login";

  if (!user) {
    if (intent !== "signup") {
      authRedirect("/signup", { error: "user", ...inviteParams });
    }
    if (!signupPassword) {
      authRedirect(returnPath, { error: "password", ...inviteParams });
    }

    const signupIp = await consumeSignupIpSlot();
    if (!signupIp.ok) {
      authRedirect(returnPath, guardErrorParams(signupIp.error, inviteParams));
    }

    const passwordHash = await hashPassword(signupPassword as string);
    const accountNumber = await generateUniqueAccountNumber();
    user = await prisma.user.create({
      data: {
        accountNumber,
        fullName: PLACEHOLDER_PROFILE_NAME,
        phone,
        countryCode,
        passwordHash,
        wallet: { create: { currency: countryCode === "GH" ? "GHS" : "USD" } },
        smsCredit: { create: { balance: 0 } },
        memberAccount: { create: {} },
      },
    });
    await attachResellerInviteFromForm(user.id, formData);
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
    const inviteParams = inviteRedirectParams(formData);
    const guardFields = readSignupGuardFields(formData);

    const otpBot = await assertOtpBotAllowed(guardFields);
    if (!otpBot.ok) {
      authRedirect(returnPath, guardErrorParams(otpBot.error, { method: "email", ...inviteParams }));
    }

    const signupBot = await assertSignupBotAllowed(guardFields);
    if (!signupBot.ok) {
      authRedirect(returnPath, guardErrorParams(signupBot.error, { method: "email", ...inviteParams }));
    }

    const parsed = emailAuthSignupSchema.safeParse({
      email: formData.get("email"),
      phone: formData.get("phone"),
      countryCode: formData.get("countryCode") ?? DEFAULT_COUNTRY_CODE,
      dialCode: formData.get("dialCode") ?? "+233",
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path[0];
      const error =
        field === "email"
          ? "email"
          : field === "password"
            ? "password"
            : field === "confirmPassword"
              ? "confirmPassword"
              : "invalid_phone";
      authRedirect(returnPath, {
        error,
        method: "email",
        ...inviteParams,
      });
    }

    const { email, countryCode, dialCode, password } = parsed.data;
    const phone = normalizePhoneWithCountry(parsed.data.phone, dialCode, countryCode);

    if (phone.length < 10) {
      authRedirect(returnPath, { error: "invalid_phone", method: "email", ...inviteParams });
    }

    const [existingPhone, existingEmail] = await Promise.all([
      prisma.user.findUnique({ where: { phone } }),
      prisma.user.findUnique({ where: { email } }),
    ]);

    if (existingPhone) {
      authRedirect(returnPath, { error: "exists", method: "email", ...inviteParams });
    }
    if (existingEmail) {
      authRedirect(returnPath, { error: "email_taken", method: "email", ...inviteParams });
    }

    const limit = await checkRateLimit(rateLimitKey("otp_request", phone));
    if (!limit.allowed) {
      authRedirect(returnPath, { error: "rate_limit", method: "email", ...inviteParams });
    }

    const otpIp = await consumeOtpIpSlot();
    if (!otpIp.ok) {
      authRedirect(returnPath, guardErrorParams(otpIp.error, { method: "email", ...inviteParams }));
    }

    const signupIp = await consumeSignupIpSlot();
    if (!signupIp.ok) {
      authRedirect(returnPath, guardErrorParams(signupIp.error, { method: "email", ...inviteParams }));
    }

    const passwordHash = await hashPassword(password);
    const accountNumber = await generateUniqueAccountNumber();
    const user = await prisma.user.create({
      data: {
        accountNumber,
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
    await attachResellerInviteFromForm(user.id, formData);

    const country = getCountryByCode(countryCode);
    await logAuthEvent(
      "SIGNUP_STARTED",
      { phone, email, signupMethod: "email_otp", countryCode, smsProvider: country?.defaultProvider },
      user.id,
    );

    const deliveryOpts = await emailOtpDelivery(email);

    let otp;
    try {
      otp = await createAndSendOtp(phone, "SIGNUP_VERIFY", countryCode, user.id, deliveryOpts);
    } catch {
      authRedirect(returnPath, { error: "email_send", method: "email", ...inviteParams });
    }

    if (!otp.ok) {
      authRedirect(returnPath, {
        error: "otp_cooldown",
        cooldown: String(otp.cooldownSec),
        method: "email",
        ...inviteParams,
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
  const deliveryOpts = await emailOtpDelivery(loginEmail);

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
    const field = parsed.error.issues[0]?.path[0];
    if (field === "email") {
      authRedirect("/complete-profile", { error: "email" });
    }
    authRedirect("/complete-profile", { error: "name" });
  }

  const { fullName, email } = parsed.data;

  const taken = await prisma.user.findFirst({
    where: { email, id: { not: session.userId } },
  });
  if (taken) {
    authRedirect("/complete-profile", { error: "email_taken" });
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      fullName,
      email,
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
  if (session.role === "MEMBER" && (await userNeedsOnboarding(session.userId))) {
    redirect("/onboarding");
  }
  redirect("/dashboard");
}

export async function signupAction(formData: FormData) {
  const signupMethod = String(formData.get("signupMethod") ?? "phone");
  const dialCode = String(formData.get("dialCode") ?? "+233");
  const countryCode = String(formData.get("countryCode") ?? DEFAULT_COUNTRY_CODE).toUpperCase();
  const inviteParams = inviteRedirectParams(formData);
  const guardFields = readSignupGuardFields(formData);

const otpBot = await assertOtpBotAllowed(guardFields);
  if (!otpBot.ok) {
    authRedirect("/signup", guardErrorParams(otpBot.error, { method: signupMethod, ...inviteParams }));
  }

  const signupBot = await assertSignupBotAllowed(guardFields);
  if (!signupBot.ok) {
    authRedirect("/signup", guardErrorParams(signupBot.error, { method: signupMethod, ...inviteParams }));
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
    authRedirect("/signup", { error: String(field), method: signupMethod, ...inviteParams });
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

  const existingPhone = await prisma.user.findUnique({ where: { phone } });
  if (existingPhone) {
    authRedirect("/signup", { error: "exists", method: signupMethod, ...inviteParams });
  }

  if (email) {
    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken) {
      authRedirect("/signup", { error: "email_taken", method: signupMethod, ...inviteParams });
    }
  }

  const ipKey = rateLimitKey("signup", phone);
  const limit = await checkRateLimit(ipKey);
  if (!limit.allowed) {
    authRedirect("/signup", { error: "rate_limit", method: signupMethod, ...inviteParams });
  }

  const otpIp = await consumeOtpIpSlot();
  if (!otpIp.ok) {
    authRedirect("/signup", guardErrorParams(otpIp.error, { method: signupMethod, ...inviteParams }));
  }

  const signupIp = await consumeSignupIpSlot();
  if (!signupIp.ok) {
    authRedirect("/signup", guardErrorParams(signupIp.error, { method: signupMethod, ...inviteParams }));
  }

  const passwordHash = await hashPassword(password);
  const accountNumber = await generateUniqueAccountNumber();
  const user = await prisma.user.create({
    data: {
      accountNumber,
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
  await attachResellerInviteFromForm(user.id, formData);

  const deliveryOpts =
    email && signupMethod === "email" ? await emailOtpDelivery(email) : undefined;

  let otp;
  try {
    otp = await createAndSendOtp(
      phone,
      "SIGNUP_VERIFY",
      countryCode,
      user.id,
      deliveryOpts,
    );
  } catch {
    authRedirect("/signup", {
      error: email && signupMethod === "email" ? "email_send" : "otp",
      method: signupMethod,
      ...inviteParams,
    });
  }
  if (!otp.ok) {
    authRedirect("/signup", {
      error: "otp_cooldown",
      cooldown: String(otp.cooldownSec),
      method: signupMethod,
      ...inviteParams,
    });
  }

  const country = getCountryByCode(countryCode);
  await logAuthEvent("SIGNUP_STARTED", {
    phone,
    signupMethod: parsed.data.signupMethod,
    countryCode,
    smsProvider: country?.defaultProvider,
  }, user.id);

  if (email && otp.delivery === "email") {
    authRedirect(
      "/verify-otp",
      verifyOtpParamsForEmailFlow(phone, "signup", countryCode, email, otp.delivery),
    );
  }

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
    await sendWelcomeEmailIfAvailable(user!);
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
  if (!user) {
    await recordFailedAttempt(rateLimitKey("login", identifier));
    await logAuthEvent("LOGIN_FAILED", {
      identifier,
      reason: "user_not_found",
    });
    if (usePhoneForm) passwordLoginRedirectPhone({ error: "invalid" });
    // Email login: distinguish missing account so users who signed up phone-only get a clear path
    passwordLoginRedirect({
      error: "email_not_found",
      ...(emailRaw ? { email: emailRaw } : {}),
    });
  }

  // Drop expired lock counters so users are not stuck after the lock window
  if (!isAccountLocked(user.lockedUntil) && user.failedLoginCount > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });
    user.failedLoginCount = 0;
    user.lockedUntil = null;
  }

  if (isAccountLocked(user.lockedUntil)) {
    await logAuthEvent("LOGIN_FAILED", {
      identifier,
      reason: "locked",
      userId: user.id,
    });
    if (usePhoneForm) passwordLoginRedirectPhone({ error: "locked" });
    passwordLoginRedirect({ error: "locked", ...(emailRaw ? { email: emailRaw } : {}) });
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    await recordFailedAttempt(rateLimitKey("login", identifier));
    const count = user.failedLoginCount + 1;
    const lockedUntil =
      count >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : user.lockedUntil;
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: count, lockedUntil },
    });
    await logAuthEvent("LOGIN_FAILED", {
      identifier,
      reason: "bad_password",
      userId: user.id,
    });

    // OTP-era / forgotten password: steer verified users to code login instead of dead-end
    if (user.isVerified) {
      if (user.email && emailRaw) {
        otpLoginRedirect({
          method: "email",
          email: user.email,
          error: "use_otp",
        });
      }
      if (usePhoneForm || user.phone) {
        otpLoginRedirect({
          method: "phone",
          error: "use_otp",
        });
      }
    }

    if (usePhoneForm) passwordLoginRedirectPhone({ error: "invalid" });
    passwordLoginRedirect({
      error: "invalid",
      ...(emailRaw ? { email: emailRaw } : {}),
    });
  }

  if (user.role === "MEMBER") {
    const account = await getMemberAccountForUser(user.id);
    if (isMemberSuspended(account)) {
      if (usePhoneForm) passwordLoginRedirectPhone({ error: "suspended" });
      passwordLoginRedirect({ error: "suspended", ...(emailRaw ? { email: emailRaw } : {}) });
    }
  }

  if (!user.isVerified) {
    const deliveryOpts = user.email ? await emailOtpDelivery(user.email) : undefined;
    let otp;
    try {
      otp = await createAndSendOtp(
        user.phone,
        "SIGNUP_VERIFY",
        user.countryCode,
        user.id,
        deliveryOpts,
      );
    } catch {
      if (usePhoneForm) passwordLoginRedirectPhone({ error: "email_send" });
      passwordLoginRedirect({
        error: "email_send",
        ...(emailRaw ? { email: emailRaw } : {}),
      });
    }
    if (!otp.ok) {
      if (usePhoneForm) passwordLoginRedirectPhone({ error: "otp_cooldown" });
      passwordLoginRedirect({ error: "otp_cooldown", ...(emailRaw ? { email: emailRaw } : {}) });
    }
    if (user.email && otp.delivery === "email") {
      authRedirect(
        "/verify-otp",
        verifyOtpParamsForEmailFlow(
          user.phone,
          "signup",
          user.countryCode,
          user.email,
          otp.delivery,
        ),
      );
    }
    authRedirect("/verify-otp", { phone: user.phone, purpose: "signup" });
  }

  await finishLogin(user, String(formData.get("returnTo") ?? ""));
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
  const deliveryOpts = user!.email
    ? await emailOtpDelivery(user!.email)
    : undefined;
  let otp;
  try {
    otp = await createAndSendOtp(
      phone,
      "LOGIN",
      user!.countryCode,
      user!.id,
      deliveryOpts,
    );
  } catch {
    authRedirect("/login", { error: "email_send", mode: "sms" });
  }
  if (!otp.ok) {
    authRedirect("/login", {
      error: "otp_cooldown",
      cooldown: String(otp.cooldownSec),
      mode: "sms",
    });
  }

  if (user!.email && otp.delivery === "email") {
    authRedirect(
      "/verify-otp",
      verifyOtpParamsForEmailFlow(
        phone,
        "login",
        user!.countryCode,
        user!.email,
        otp.delivery,
      ),
    );
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
    const useEmail = Boolean(user.email && (await isEmailConfiguredAsync()));
    const deliveryOpts = useEmail && user.email ? await emailOtpDelivery(user.email) : undefined;

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
  const { getSession, getRealSession } = await import("@/lib/auth/session");
  const session = await getSession();
  const real = await getRealSession();
  if (session) {
    await logAuthEvent(
      "LOGOUT",
      {
        phone: session.phone,
        impersonatorId: session.impersonatorId,
        realUserId: real?.userId,
      },
      session.impersonatorId ?? session.userId,
    );
  }
  await clearSession();
  redirect("/login");
}
