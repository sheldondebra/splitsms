import { prisma } from "@/lib/db";

export async function fundSubUserWallet(
  resellerUserId: string,
  subUserId: string,
  amount: number,
) {
  if (amount <= 0) throw new Error("Invalid amount");

  const reseller = await prisma.reseller.findUnique({
    where: { userId: resellerUserId },
    include: { user: { include: { wallet: true } } },
  });
  if (!reseller || reseller.status !== "APPROVED") {
    throw new Error("Reseller not approved");
  }

  const link = await prisma.resellerUser.findFirst({
    where: { resellerId: reseller.id, userId: subUserId },
  });
  if (!link || link.isSuspended) throw new Error("Invalid sub-user");

  const resellerWallet = reseller.user.wallet;
  const subWallet = await prisma.wallet.findUnique({ where: { userId: subUserId } });
  if (!resellerWallet || !subWallet) throw new Error("Wallet missing");
  if (resellerWallet.balance.toNumber() < amount) {
    throw new Error("Insufficient reseller wallet balance");
  }

  const currency = resellerWallet.currency;
  const resellerBefore = resellerWallet.balance.toNumber();
  const subBefore = subWallet.balance.toNumber();

  await prisma.$transaction([
    prisma.wallet.update({
      where: { userId: resellerUserId },
      data: { balance: { decrement: amount } },
    }),
    prisma.wallet.update({
      where: { userId: subUserId },
      data: { balance: { increment: amount } },
    }),
    prisma.transaction.create({
      data: {
        userId: resellerUserId,
        type: "RESELLER_SUB_FUND",
        amount,
        currency,
        description: `Funded sub-user ${subUserId}`,
        status: "completed",
        balanceBefore: resellerBefore,
        balanceAfter: resellerBefore - amount,
        metadata: { subUserId, direction: "out" },
      },
    }),
    prisma.transaction.create({
      data: {
        userId: subUserId,
        type: "RESELLER_SUB_FUND",
        amount,
        currency,
        description: `Funded by reseller ${reseller.businessName}`,
        status: "completed",
        balanceBefore: subBefore,
        balanceAfter: subBefore + amount,
        metadata: { resellerId: reseller.id, direction: "in" },
      },
    }),
  ]);
}

export async function fundSubUserCredits(
  resellerUserId: string,
  subUserId: string,
  credits: number,
  countryCode: string,
) {
  const { resolveSmsPriceForUser } = await import("@/lib/reseller/pricing");
  const price = await resolveSmsPriceForUser(subUserId, countryCode);
  const cost = credits * price.sellPrice;

  const reseller = await prisma.reseller.findUnique({
    where: { userId: resellerUserId },
    include: { user: { include: { wallet: true } } },
  });
  if (!reseller || reseller.status !== "APPROVED") throw new Error("Reseller not approved");

  const link = await prisma.resellerUser.findFirst({
    where: { resellerId: reseller.id, userId: subUserId },
  });
  if (!link || link.isSuspended) throw new Error("Invalid sub-user");

  const resellerWallet = reseller.user.wallet;
  if (!resellerWallet || resellerWallet.balance.toNumber() < cost) {
    throw new Error("Insufficient reseller wallet balance");
  }

  const credit = await prisma.smsCredit.findUnique({ where: { userId: subUserId } });
  const creditsBefore = credit?.balance ?? 0;
  const resellerBefore = resellerWallet.balance.toNumber();

  await prisma.$transaction([
    prisma.wallet.update({
      where: { userId: resellerUserId },
      data: { balance: { decrement: cost } },
    }),
    prisma.smsCredit.upsert({
      where: { userId: subUserId },
      update: { balance: { increment: credits } },
      create: { userId: subUserId, balance: credits },
    }),
    prisma.transaction.create({
      data: {
        userId: resellerUserId,
        type: "RESELLER_SUB_FUND",
        amount: cost,
        currency: resellerWallet.currency,
        credits,
        description: `SMS credits for sub-user (${credits})`,
        status: "completed",
        balanceBefore: resellerBefore,
        balanceAfter: resellerBefore - cost,
        metadata: { subUserId, credits, countryCode },
      },
    }),
    prisma.transaction.create({
      data: {
        userId: subUserId,
        type: "RESELLER_SUB_FUND",
        amount: 0,
        currency: resellerWallet.currency,
        credits,
        description: `${credits} SMS credits from reseller`,
        status: "completed",
        metadata: { resellerId: reseller.id, creditsBefore, creditsAfter: creditsBefore + credits },
      },
    }),
  ]);
}
