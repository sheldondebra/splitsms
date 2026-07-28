import { prisma } from "@/lib/db";
import type { PromoCodeType } from "@/lib/generated/prisma/client";

export async function applyPromoCode(userId: string, code: string) {
  const normalized = code.trim().toUpperCase();
  const promo = await prisma.promoCode.findFirst({
    where: { code: normalized, isActive: true },
  });

  if (!promo) return { ok: false as const, error: "Invalid promo code" };
  if (promo.userId && promo.userId !== userId) {
    return { ok: false as const, error: "Promo not available for your account" };
  }
  if (promo.resellerId) {
    const membership = await prisma.resellerUser.findUnique({ where: { userId } });
    if (!membership || membership.resellerId !== promo.resellerId) {
      return { ok: false as const, error: "Promo is only for this partner's clients" };
    }
  }
  if (promo.expiresAt && promo.expiresAt < new Date()) {
    return { ok: false as const, error: "Promo code expired" };
  }
  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) {
    return { ok: false as const, error: "Promo code fully redeemed" };
  }

  const redeemed = await prisma.promoRedemption.findUnique({
    where: { userId_promoCodeId: { userId, promoCodeId: promo.id } },
  });
  if (redeemed) return { ok: false as const, error: "You already used this promo" };

  const value = promo.value.toNumber();

  await prisma.$transaction(async (tx) => {
    await tx.promoRedemption.create({
      data: { userId, promoCodeId: promo.id },
    });
    await tx.promoCode.update({
      where: { id: promo.id },
      data: { usedCount: { increment: 1 } },
    });

    if (promo.type === "WALLET_BONUS") {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      const before = wallet?.balance.toNumber() ?? 0;
      await tx.wallet.update({
        where: { userId },
        data: { balance: { increment: value } },
      });
      await tx.transaction.create({
        data: {
          userId,
          type: "PROMO_CREDIT",
          amount: value,
          currency: wallet?.currency ?? "GHS",
          description: `Promo ${promo.code} wallet bonus`,
          reference: promo.code,
          balanceBefore: before,
          balanceAfter: before + value,
        },
      });
    } else if (promo.type === "FIXED_CREDIT") {
      const credit = await tx.smsCredit.findUnique({ where: { userId } });
      const before = credit?.balance ?? 0;
      await tx.smsCredit.upsert({
        where: { userId },
        update: { balance: { increment: Math.floor(value) } },
        create: { userId, balance: Math.floor(value) },
      });
      await tx.transaction.create({
        data: {
          userId,
          type: "PROMO_CREDIT",
          amount: 0,
          currency: "GHS",
          credits: Math.floor(value),
          description: `Promo ${promo.code} — ${Math.floor(value)} SMS credits`,
          reference: promo.code,
          metadata: { creditsBefore: before, creditsAfter: before + Math.floor(value) },
        },
      });
    } else if (promo.type === "PERCENT_BONUS") {
      const credit = await tx.smsCredit.findUnique({ where: { userId } });
      const base = credit?.balance ?? 0;
      const bonus = Math.max(1, Math.floor((base * value) / 100));
      await tx.smsCredit.upsert({
        where: { userId },
        update: { balance: { increment: bonus } },
        create: { userId, balance: bonus },
      });
      await tx.transaction.create({
        data: {
          userId,
          type: "PROMO_CREDIT",
          amount: 0,
          currency: "GHS",
          credits: bonus,
          description: `Promo ${promo.code} — ${value}% bonus (${bonus} credits)`,
          reference: promo.code,
        },
      });
    }
  });

  return { ok: true as const, type: promo.type as PromoCodeType, value };
}
