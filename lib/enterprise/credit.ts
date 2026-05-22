import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";

export async function chargeEnterpriseCredit(
  enterpriseId: string,
  amount: number,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const credit = await prisma.enterpriseCredit.findUnique({
    where: { enterpriseId },
  });
  if (!credit) return { ok: false, reason: "no_credit_account" };

  const limit = credit.creditLimit.toNumber();
  const used = credit.usedCredit.toNumber();
  if (used + amount > limit) {
    return { ok: false, reason: "credit_limit_exceeded" };
  }

  await prisma.enterpriseCredit.update({
    where: { enterpriseId },
    data: { usedCredit: { increment: new Prisma.Decimal(amount) } },
  });
  return { ok: true };
}

export async function releaseEnterpriseCredit(enterpriseId: string, amount: number) {
  const credit = await prisma.enterpriseCredit.findUnique({
    where: { enterpriseId },
  });
  if (!credit) return;
  const used = credit.usedCredit.toNumber();
  const release = Math.min(amount, used);
  if (release <= 0) return;
  await prisma.enterpriseCredit.update({
    where: { enterpriseId },
    data: { usedCredit: { decrement: new Prisma.Decimal(release) } },
  });
}
