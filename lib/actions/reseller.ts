"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { requireApprovedReseller } from "@/lib/reseller/context";
import { fundSubUserWallet, fundSubUserCredits } from "@/lib/reseller/fund";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createSubUserAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller?error=not_approved");

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || undefined;
  const countryCode = String(formData.get("countryCode") ?? "GH");
  const password = String(formData.get("password") ?? "");
  const dailySmsLimit = Number(formData.get("dailySmsLimit") || 0) || undefined;

  if (!fullName || !phone || password.length < 8) {
    redirect("/reseller/users?error=invalid");
  }

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) redirect("/reseller/users?error=exists");

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      fullName,
      phone,
      email,
      countryCode,
      passwordHash,
      role: "MEMBER",
      isVerified: true,
      wallet: { create: { currency: "GHS" } },
      smsCredit: { create: { balance: 0 } },
    },
  });

  await prisma.resellerUser.create({
    data: {
      resellerId: reseller.id,
      userId: user.id,
      dailySmsLimit,
    },
  });

  revalidatePath("/reseller/users");
  redirect("/reseller/users?created=1");
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

  try {
    if (mode === "credits") {
      await fundSubUserCredits(session.userId, subUserId, credits, countryCode);
    } else {
      await fundSubUserWallet(session.userId, subUserId, amount);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    redirect(`/reseller/wallet?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/reseller/wallet");
  redirect("/reseller/wallet?funded=1");
}

export async function setResellerPricingAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const countryCode = String(formData.get("countryCode")).toUpperCase();
  const sellPrice = Number(formData.get("sellPrice"));
  const currency = String(formData.get("currency") ?? "GHS");

  await prisma.resellerCountryPricing.upsert({
    where: { resellerId_countryCode: { resellerId: reseller.id, countryCode } },
    update: { sellPrice, currency, isActive: true },
    create: { resellerId: reseller.id, countryCode, sellPrice, currency },
  });

  revalidatePath("/reseller/pricing");
  redirect("/reseller/pricing?saved=1");
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

  await prisma.reseller.update({
    where: { id: reseller.id },
    data: {
      brandName: String(formData.get("brandName") ?? "") || reseller.brandName,
      domain: String(formData.get("domain") ?? "") || undefined,
    },
  });

  revalidatePath("/reseller/settings");
  redirect("/reseller/settings?saved=1");
}

export async function toggleSubUserSuspendAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const subUserId = String(formData.get("subUserId"));
  const link = await prisma.resellerUser.findFirst({
    where: { resellerId: reseller.id, userId: subUserId },
  });
  if (!link) redirect("/reseller/users");

  await prisma.resellerUser.update({
    where: { id: link.id },
    data: { isSuspended: !link.isSuspended },
  });

  revalidatePath("/reseller/users");
  redirect("/reseller/users");
}

export async function applyForResellerAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const businessName = String(formData.get("businessName") ?? "").trim();
  if (!businessName) redirect("/dashboard?error=reseller");

  const existing = await prisma.reseller.findUnique({ where: { userId: session.userId } });
  if (existing) redirect("/reseller");

  await prisma.reseller.create({
    data: {
      userId: session.userId,
      businessName,
      brandName: businessName,
      status: "PENDING",
    },
  });

  await prisma.user.update({
    where: { id: session.userId },
    data: { role: "RESELLER" },
  });

  redirect("/reseller?pending=1");
}
