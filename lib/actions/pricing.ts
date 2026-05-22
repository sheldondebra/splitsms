"use server";

import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function updateCountryPricingAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");

  const id = String(formData.get("id"));
  const memberPrice = Number(formData.get("memberPrice"));
  const costPrice = Number(formData.get("costPrice"));
  const provider = String(formData.get("provider") ?? "mNotify");
  const currency = String(formData.get("currency") ?? "GHS").trim() || "GHS";
  const creditsPerSms = Math.max(1, Number(formData.get("creditsPerSms") ?? 1));
  const isActive = formData.get("isActive") === "on";

  await prisma.smsPricing.update({
    where: { id },
    data: {
      memberPrice,
      costPrice,
      provider,
      currency,
      creditsPerSms,
      isActive,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "PRICING_UPDATED",
      entityType: "SmsPricing",
      entityId: id,
      metadata: { memberPrice, costPrice, provider },
    },
  });

  revalidatePath("/admin/pricing");
  revalidatePath("/pricing");
  revalidatePath("/dashboard/pricing");
  redirect("/admin/pricing?saved=1");
}

export async function setUserCustomPricingAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");

  const userId = String(formData.get("userId"));
  const countryCode = String(formData.get("countryCode")).toUpperCase();
  const sellPrice = Number(formData.get("sellPrice"));
  const currency = String(formData.get("currency") ?? "GHS");

  await prisma.userSmsPricing.upsert({
    where: { userId_countryCode: { userId, countryCode } },
    update: { sellPrice, currency, isActive: true },
    create: { userId, countryCode, sellPrice, currency },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "USER_PRICING_SET",
      entityType: "UserSmsPricing",
      entityId: userId,
      metadata: { countryCode, sellPrice },
    },
  });

  revalidatePath("/admin/pricing");
  revalidatePath("/dashboard/pricing");
  redirect("/admin/pricing?userPricing=1");
}

export async function createPromoCodeAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const type = String(formData.get("type") ?? "FIXED_CREDIT") as
    | "PERCENT_BONUS"
    | "FIXED_CREDIT"
    | "WALLET_BONUS";
  const value = Number(formData.get("value"));
  const maxUses = Number(formData.get("maxUses") || 0) || undefined;

  await prisma.promoCode.create({
    data: {
      code,
      type,
      value,
      maxUses,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "PROMO_CREATED",
      entityType: "PromoCode",
      entityId: code,
    },
  });

  revalidatePath("/admin/billing");
  redirect("/admin/billing?promo=1");
}
