"use server";

import { randomBytes, createHash } from "crypto";
import { generateUniqueAccountNumber } from "@/lib/auth/account-number";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";
import { generateUniqueResellerInviteCode } from "@/lib/reseller/invite";
import { normalizeResellerDomain } from "@/lib/reseller/tenant";
import { getSession } from "@/lib/auth/session";
import { requireApprovedReseller } from "@/lib/reseller/context";
import { fundSubUserWallet, fundSubUserCredits } from "@/lib/reseller/fund";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  API_PERMISSIONS,
  DEFAULT_API_PERMISSIONS,
  type ApiPermission,
} from "@/lib/api/permissions";
import { RATE_LIMIT_TIERS } from "@/lib/api/rate-limit";

function clientPath(userId: string, query?: Record<string, string>) {
  const q = query ? `?${new URLSearchParams(query).toString()}` : "";
  return `/reseller/users/${userId}${q}`;
}

async function requireResellerSubUser(sessionUserId: string, subUserId: string) {
  const reseller = await requireApprovedReseller(sessionUserId);
  if (!reseller) return null;
  const link = await prisma.resellerUser.findFirst({
    where: { resellerId: reseller.id, userId: subUserId },
  });
  if (!link) return null;
  return { reseller, link };
}

export async function createSubUserAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller?error=not_approved");

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || undefined;
  const countryCode = String(formData.get("countryCode") ?? "GH").toUpperCase();
  const password = String(formData.get("password") ?? "");
  const dailySmsLimit = Number(formData.get("dailySmsLimit") || 0) || undefined;
  const verifyNow = formData.get("verifyNow") === "1";

  if (!fullName || !phone || password.length < 8) {
    redirect("/reseller/users?error=invalid");
  }

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) redirect("/reseller/users?error=exists");

  if (email) {
    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken) redirect("/reseller/users?error=email_exists");
  }

  const passwordHash = await hashPassword(password);
  const accountNumber = await generateUniqueAccountNumber();

  const user = await prisma.user.create({
    data: {
      accountNumber,
      fullName,
      phone,
      email,
      countryCode,
      passwordHash,
      role: "MEMBER",
      isVerified: verifyNow,
      wallet: { create: { currency: "GHS" } },
      smsCredit: { create: { balance: 0 } },
      memberAccount: { create: {} },
    },
  });

  await prisma.resellerUser.create({
    data: {
      resellerId: reseller.id,
      userId: user.id,
      dailySmsLimit,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "RESELLER_CLIENT_CREATED",
      entityType: "User",
      entityId: user.id,
      metadata: { fullName, phone, countryCode },
    },
  });

  revalidatePath("/reseller/users");
  redirect(clientPath(user.id, { created: "1" }));
}

export async function fundSubUserAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const subUserId = String(formData.get("subUserId"));
  const mode = String(formData.get("mode") ?? "wallet");
  const amount = Number(formData.get("amount"));
  const credits = Number(formData.get("credits"));
  const countryCode = String(formData.get("countryCode") ?? "GH");
  const returnTo = String(formData.get("returnTo") ?? "");
  const successPath =
    returnTo === "client" ? clientPath(subUserId, { saved: "funded" }) : "/reseller/wallet?funded=1";
  const errorBase = returnTo === "client" ? clientPath(subUserId) : "/reseller/wallet";

  try {
    if (mode === "credits") {
      await fundSubUserCredits(session.userId, subUserId, credits, countryCode);
    } else {
      await fundSubUserWallet(session.userId, subUserId, amount);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    redirect(
      returnTo === "client"
        ? clientPath(subUserId, { error: encodeURIComponent(msg) })
        : `${errorBase}?error=${encodeURIComponent(msg)}`,
    );
  }

  revalidatePath("/reseller/wallet");
  revalidatePath("/reseller/users");
  revalidatePath(clientPath(subUserId));
  redirect(successPath);
}

export async function setResellerPricingAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const countryCode = String(formData.get("countryCode") ?? "").toUpperCase().trim();
  const sellPrice = Number(formData.get("sellPrice"));
  const currency = String(formData.get("currency") ?? "GHS").trim() || "GHS";

  if (!countryCode || !Number.isFinite(sellPrice) || sellPrice <= 0) {
    redirect("/reseller/pricing?error=invalid");
  }

  await prisma.resellerCountryPricing.upsert({
    where: { resellerId_countryCode: { resellerId: reseller.id, countryCode } },
    update: { sellPrice, currency, isActive: true },
    create: { resellerId: reseller.id, countryCode, sellPrice, currency },
  });

  revalidatePath("/reseller/pricing");
  redirect(`/reseller/pricing?saved=1&country=${encodeURIComponent(countryCode)}`);
}

export async function clearResellerPricingAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const countryCode = String(formData.get("countryCode") ?? "").toUpperCase().trim();
  if (!countryCode) redirect("/reseller/pricing?error=invalid");

  await prisma.resellerCountryPricing.updateMany({
    where: { resellerId: reseller.id, countryCode },
    data: { isActive: false },
  });

  revalidatePath("/reseller/pricing");
  redirect(`/reseller/pricing?saved=cleared&country=${encodeURIComponent(countryCode)}`);
}

export async function saveBrandingAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const data = {
    logoUrl: String(formData.get("logoUrl") ?? "") || undefined,
    primaryColor: String(formData.get("primaryColor") ?? "#f97316"),
    secondaryColor: String(formData.get("secondaryColor") ?? "#0f0f0f"),
    accentColor: String(formData.get("accentColor") ?? "") || undefined,
    supportEmail: String(formData.get("supportEmail") ?? "") || undefined,
  };

  await prisma.whiteLabelBrand.upsert({
    where: { resellerId: reseller.id },
    update: data,
    create: { resellerId: reseller.id, ...data },
  });

  const rawDomain = String(formData.get("domain") ?? "").trim();
  await prisma.reseller.update({
    where: { id: reseller.id },
    data: {
      brandName: String(formData.get("brandName") ?? "") || reseller.brandName,
      domain: rawDomain ? normalizeResellerDomain(rawDomain) : null,
    },
  });

  revalidatePath("/reseller/settings");
  redirect("/reseller/settings?saved=1");
}

export async function toggleSubUserSuspendAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const subUserId = String(formData.get("subUserId"));
  const ctx = await requireResellerSubUser(session.userId, subUserId);
  if (!ctx) redirect("/reseller/users");

  await prisma.resellerUser.update({
    where: { id: ctx.link.id },
    data: { isSuspended: !ctx.link.isSuspended },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: ctx.link.isSuspended ? "RESELLER_CLIENT_ACTIVATED" : "RESELLER_CLIENT_SUSPENDED",
      entityType: "User",
      entityId: subUserId,
    },
  });

  revalidatePath("/reseller/users");
  revalidatePath(clientPath(subUserId));
  const returnTo = String(formData.get("returnTo") ?? "");
  redirect(returnTo === "client" ? clientPath(subUserId, { saved: "access" }) : "/reseller/users");
}

export async function updateSubUserProfileAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const subUserId = String(formData.get("subUserId"));
  const ctx = await requireResellerSubUser(session.userId, subUserId);
  if (!ctx) redirect("/reseller/users");

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const countryCode = String(formData.get("countryCode") ?? "GH").toUpperCase();
  const dailyRaw = String(formData.get("dailySmsLimit") ?? "").trim();
  const dailySmsLimit = dailyRaw === "" ? null : Number(dailyRaw) || null;

  if (!fullName) redirect(clientPath(subUserId, { error: "name_required" }));

  if (email) {
    const emailTaken = await prisma.user.findFirst({
      where: { email, NOT: { id: subUserId } },
    });
    if (emailTaken) redirect(clientPath(subUserId, { error: "email_exists" }));
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: subUserId },
      data: { fullName, email, countryCode },
    }),
    prisma.resellerUser.update({
      where: { id: ctx.link.id },
      data: { dailySmsLimit },
    }),
  ]);

  revalidatePath("/reseller/users");
  revalidatePath(clientPath(subUserId));
  redirect(clientPath(subUserId, { saved: "profile" }));
}

export async function setSubUserVerifiedAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const subUserId = String(formData.get("subUserId"));
  const verified = formData.get("verified") === "1";
  const ctx = await requireResellerSubUser(session.userId, subUserId);
  if (!ctx) redirect("/reseller/users");

  await prisma.user.update({
    where: { id: subUserId },
    data: {
      isVerified: verified,
      ...(verified ? { failedLoginCount: 0, lockedUntil: null } : {}),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: verified ? "RESELLER_CLIENT_VERIFIED" : "RESELLER_CLIENT_UNVERIFIED",
      entityType: "User",
      entityId: subUserId,
    },
  });

  revalidatePath("/reseller/users");
  revalidatePath(clientPath(subUserId));
  const returnTo = String(formData.get("returnTo") ?? "client");
  redirect(
    returnTo === "list"
      ? `/reseller/users?saved=${verified ? "verified" : "unverified"}`
      : clientPath(subUserId, { saved: "verify" }),
  );
}

export async function unlockSubUserLoginAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const subUserId = String(formData.get("subUserId"));
  const ctx = await requireResellerSubUser(session.userId, subUserId);
  if (!ctx) redirect("/reseller/users");

  await prisma.user.update({
    where: { id: subUserId },
    data: { failedLoginCount: 0, lockedUntil: null },
  });

  revalidatePath(clientPath(subUserId));
  redirect(clientPath(subUserId, { saved: "unlock" }));
}

export async function resetSubUserPasswordAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const subUserId = String(formData.get("subUserId"));
  const ctx = await requireResellerSubUser(session.userId, subUserId);
  if (!ctx) redirect("/reseller/users");

  const password = String(formData.get("password") ?? "").trim();
  const generate = formData.get("generate") === "1";
  const newPassword =
    generate || !password
      ? randomBytes(9).toString("base64url").slice(0, 12)
      : password;

  if (newPassword.length < 8) {
    redirect(clientPath(subUserId, { error: "password_short" }));
  }

  await prisma.user.update({
    where: { id: subUserId },
    data: {
      passwordHash: await hashPassword(newPassword),
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "RESELLER_CLIENT_PASSWORD_RESET",
      entityType: "User",
      entityId: subUserId,
      metadata: { generated: generate || !password },
    },
  });

  revalidatePath(clientPath(subUserId));
  redirect(clientPath(subUserId, { saved: "password", temp: newPassword }));
}

export async function applyForResellerAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const businessName = String(formData.get("businessName") ?? "").trim();
  if (!businessName) redirect("/dashboard?error=reseller");

  const existing = await prisma.reseller.findUnique({ where: { userId: session.userId } });
  if (existing) redirect("/reseller");

  const inviteCode = await generateUniqueResellerInviteCode();

  await prisma.reseller.create({
    data: {
      userId: session.userId,
      businessName,
      brandName: businessName,
      inviteCode,
      status: "PENDING",
    },
  });

  redirect("/reseller?pending=1");
}

export type CreateResellerClientInput = {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
  countryCode?: string;
  credits?: number;
  verifyNow?: boolean;
};

export type CreateResellerClientResult =
  | {
      ok: true;
      userId: string;
      fullName: string;
      phone: string;
      email: string | null;
      password: string;
      creditsGranted: number;
      loginUrl: string;
    }
  | { ok: false; error: string };

/** Create a client and return login details for the reseller to share. */
export async function createResellerClientAction(
  input: CreateResellerClientInput,
): Promise<CreateResellerClientResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Sign in required." };

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) return { ok: false, error: "Reseller access required." };

  const fullName = String(input.fullName ?? "").trim();
  const phone = String(input.phone ?? "").trim();
  const email = String(input.email ?? "").trim() || undefined;
  const countryCode = String(input.countryCode ?? "GH").toUpperCase();
  const password = String(input.password ?? "");
  const credits = Math.max(0, Math.floor(Number(input.credits ?? 0) || 0));
  const verifyNow = Boolean(input.verifyNow);

  if (!fullName || !phone || password.length < 8) {
    return { ok: false, error: "Name, phone, and an 8+ character password are required." };
  }

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) return { ok: false, error: "That phone number is already registered." };

  if (email) {
    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken) return { ok: false, error: "That email is already in use." };
  }

  if (credits > 0) {
    const wallet = await prisma.wallet.findUnique({ where: { userId: session.userId } });
    const custom = await prisma.resellerCountryPricing.findFirst({
      where: { resellerId: reseller.id, countryCode, isActive: true },
    });
    const pricing = await prisma.smsPricing.findFirst({
      where: { country: { code: countryCode }, isActive: true },
    });
    const sell = custom?.sellPrice.toNumber() ?? pricing?.memberPrice.toNumber() ?? 0.05;
    const cost = Math.round(credits * sell * 100) / 100;
    if (!wallet || wallet.balance.toNumber() < cost) {
      return {
        ok: false,
        error: `Not enough wallet balance to fund ${credits} SMS credits (${wallet?.currency ?? "GHS"} ${cost.toFixed(2)} needed). Top up first or choose fewer credits.`,
      };
    }
  }

  const passwordHash = await hashPassword(password);
  const accountNumber = await generateUniqueAccountNumber();

  const user = await prisma.user.create({
    data: {
      accountNumber,
      fullName,
      phone,
      email,
      countryCode,
      passwordHash,
      role: "MEMBER",
      isVerified: verifyNow,
      wallet: { create: { currency: "GHS" } },
      smsCredit: { create: { balance: 0 } },
      memberAccount: { create: {} },
    },
  });

  await prisma.resellerUser.create({
    data: {
      resellerId: reseller.id,
      userId: user.id,
    },
  });

  let creditsGranted = 0;
  if (credits > 0) {
    try {
      await fundSubUserCredits(session.userId, user.id, credits, countryCode);
      creditsGranted = credits;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not fund credits";
      await prisma.auditLog.create({
        data: {
          actorId: session.userId,
          action: "RESELLER_CLIENT_CREATED",
          entityType: "User",
          entityId: user.id,
          metadata: { fullName, phone, countryCode, creditError: msg },
        },
      });
      revalidatePath("/reseller/users");
      const { getSiteUrl } = await import("@/lib/site-config");
      const loginUrl = reseller.domain
        ? `https://${reseller.domain.replace(/^https?:\/\//, "")}/login`
        : `${getSiteUrl()}/login`;
      return {
        ok: true,
        userId: user.id,
        fullName,
        phone,
        email: email ?? null,
        password,
        creditsGranted: 0,
        loginUrl,
      };
    }
  }

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "RESELLER_CLIENT_CREATED",
      entityType: "User",
      entityId: user.id,
      metadata: { fullName, phone, countryCode, creditsGranted },
    },
  });

  revalidatePath("/reseller/users");
  revalidatePath("/reseller/wallet");

  const { getSiteUrl } = await import("@/lib/site-config");
  const loginUrl = reseller.domain
    ? `https://${reseller.domain.replace(/^https?:\/\//, "")}/login`
    : `${getSiteUrl()}/login`;

  return {
    ok: true,
    userId: user.id,
    fullName,
    phone,
    email: email ?? null,
    password,
    creditsGranted,
    loginUrl,
  };
}

/** Buy SMS packages at wholesale rates for the reseller business inventory. */
export async function buyResellerCreditsAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const credits = Math.floor(Number(formData.get("credits")));
  const countryCode = String(formData.get("countryCode") ?? "GH").toUpperCase();

  if (!credits || credits < 1) {
    redirect("/reseller/wallet?error=amount");
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId: session.userId } });
  if (!wallet) redirect("/reseller/wallet?error=wallet");

  const { resolveResellerWholesalePrice } = await import("@/lib/reseller/package-pricing");
  const { purchaseCredits } = await import("@/lib/payments/wallet");
  const { packageTotalCost } = await import("@/lib/billing/sms-packages");

  const price = await resolveResellerWholesalePrice(reseller.id, countryCode);
  const cost = packageTotalCost(credits, price.wholesalePrice);

  try {
    await purchaseCredits(session.userId, credits, cost, wallet.currency);
  } catch {
    redirect("/reseller/wallet?error=balance");
  }

  revalidatePath("/reseller/wallet");
  redirect(
    `/reseller/wallet?credits=purchased&qty=${credits}&profit=${encodeURIComponent(
      String(Math.round((credits * price.profitPerSms) * 100) / 100),
    )}`,
  );
}

function hashApiKey(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export async function createResellerClientApiKeyAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const subUserId = String(formData.get("userId") ?? "");
  const ctx = await requireResellerSubUser(session.userId, subUserId);
  if (!ctx) redirect("/reseller/users?error=invalid");

  const label = String(formData.get("label") ?? "Default").trim() || "Default";
  const isSandbox = formData.get("mode") === "sandbox";
  const raw = isSandbox
    ? `sk_test_${randomBytes(24).toString("hex")}`
    : `sk_live_${randomBytes(24).toString("hex")}`;

  const perms = formData.getAll("permissions").map(String) as ApiPermission[];
  const permissions =
    perms.length > 0
      ? perms.filter((p) => API_PERMISSIONS.includes(p))
      : [...DEFAULT_API_PERMISSIONS];

  const created = await prisma.apiKey.create({
    data: {
      userId: subUserId,
      label,
      keyHash: hashApiKey(raw),
      keyPrefix: raw.slice(0, 14),
      isSandbox,
      permissions,
      rateLimitPerMinute: RATE_LIMIT_TIERS.standard,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "RESELLER_CLIENT_API_KEY_CREATED",
      entityType: "ApiKey",
      entityId: created.id,
      metadata: { subUserId, label, isSandbox },
    },
  });

  revalidatePath(`/reseller/users/${subUserId}`);
  redirect(
    clientPath(subUserId, {
      tab: "developer",
      created: "apikey",
      key: raw,
      keyId: created.id,
    }),
  );
}

export async function revokeResellerClientApiKeyAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const subUserId = String(formData.get("userId") ?? "");
  const keyId = String(formData.get("keyId") ?? "");
  const ctx = await requireResellerSubUser(session.userId, subUserId);
  if (!ctx) redirect("/reseller/users?error=invalid");

  await prisma.apiKey.updateMany({
    where: { id: keyId, userId: subUserId, isActive: true },
    data: { isActive: false },
  });

  revalidatePath(`/reseller/users/${subUserId}`);
  redirect(clientPath(subUserId, { tab: "developer", saved: "revoked" }));
}

export async function createResellerClientPromoAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller?error=not_approved");

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const type = String(formData.get("type") ?? "FIXED_CREDIT") as
    | "PERCENT_BONUS"
    | "FIXED_CREDIT"
    | "WALLET_BONUS";
  const value = Number(formData.get("value"));
  const maxUses = Number(formData.get("maxUses") || 0) || undefined;
  const expiresRaw = String(formData.get("expiresAt") ?? "").trim();
  const expiresAt = expiresRaw ? new Date(expiresRaw) : undefined;

  if (!code || !Number.isFinite(value) || value <= 0) {
    redirect("/reseller/promos?error=invalid");
  }
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    redirect("/reseller/promos?error=invalid");
  }

  const existing = await prisma.promoCode.findUnique({ where: { code } });
  if (existing) redirect("/reseller/promos?error=exists");

  const promo = await prisma.promoCode.create({
    data: {
      code,
      type,
      value,
      maxUses,
      expiresAt,
      resellerId: reseller.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "RESELLER_PROMO_CREATED",
      entityType: "PromoCode",
      entityId: promo.id,
      metadata: {
        code,
        type,
        value,
        resellerId: reseller.id,
        source: session.impersonatorId ? "admin_impersonation" : "reseller_portal",
        impersonatorId: session.impersonatorId,
      },
    },
  });

  revalidatePath("/reseller/promos");
  redirect("/reseller/promos?saved=created");
}

export async function toggleResellerClientPromoAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller?error=not_approved");

  const promoId = String(formData.get("promoId") ?? "");
  const isActive = formData.get("isActive") === "1";

  const promo = await prisma.promoCode.findFirst({
    where: { id: promoId, resellerId: reseller.id },
  });
  if (!promo) redirect("/reseller/promos?error=invalid");

  await prisma.promoCode.update({
    where: { id: promoId },
    data: { isActive },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: isActive ? "RESELLER_PROMO_ACTIVATED" : "RESELLER_PROMO_DEACTIVATED",
      entityType: "PromoCode",
      entityId: promoId,
      metadata: {
        code: promo.code,
        resellerId: reseller.id,
        source: session.impersonatorId ? "admin_impersonation" : "reseller_portal",
        impersonatorId: session.impersonatorId,
      },
    },
  });

  revalidatePath("/reseller/promos");
  redirect("/reseller/promos?saved=updated");
}
