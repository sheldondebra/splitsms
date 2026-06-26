import { prisma } from "@/lib/db";
import { getOrCreateMemberAccount } from "@/lib/admin/member-account";

export async function userNeedsOnboarding(userId: string) {
  const account = await prisma.memberAccount.findUnique({
    where: { userId },
    select: { onboardingCompletedAt: true },
  });
  return !account?.onboardingCompletedAt;
}

export async function completeOnboarding(userId: string) {
  await getOrCreateMemberAccount(userId);
  await prisma.memberAccount.update({
    where: { userId },
    data: { onboardingCompletedAt: new Date() },
  });
}

export async function getOnboardingSnapshot(userId: string) {
  const [user, credit, wallet, senderCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true },
    }),
    prisma.smsCredit.findUnique({ where: { userId }, select: { balance: true } }),
    prisma.wallet.findUnique({
      where: { userId },
      select: { balance: true, currency: true },
    }),
    prisma.senderId.count({ where: { userId } }),
  ]);

  return {
    firstName: user?.fullName?.split(" ")[0] ?? "there",
    creditBalance: credit?.balance ?? 0,
    walletBalance: wallet?.balance.toNumber() ?? 0,
    walletCurrency: wallet?.currency ?? "GHS",
    hasSenderId: senderCount > 0,
  };
}
