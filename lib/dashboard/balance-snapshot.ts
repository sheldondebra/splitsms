import { cache } from "react";
import { prisma } from "@/lib/db";

export type BalanceSnapshot = {
  walletBalance: number;
  walletCurrency: string;
  creditBalance: number;
  lowBalance: boolean;
};

export const getBalanceSnapshot = cache(async (userId: string): Promise<BalanceSnapshot> => {
  const [wallet, credit] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId } }),
    prisma.smsCredit.findUnique({ where: { userId } }),
  ]);

  const creditBalance = credit?.balance ?? 0;

  return {
    walletBalance: wallet?.balance.toNumber() ?? 0,
    walletCurrency: wallet?.currency ?? "GHS",
    creditBalance,
    lowBalance: creditBalance <= 10,
  };
});
