import { prisma } from "@/lib/db";

export type OfflineBankDetails = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch?: string;
  swiftCode?: string;
  instructions: string;
};

const DEFAULT: OfflineBankDetails = {
  bankName: process.env.OFFLINE_BANK_NAME ?? "Ecobank Ghana",
  accountName: process.env.OFFLINE_ACCOUNT_NAME ?? "Tecunit Ltd",
  accountNumber: process.env.OFFLINE_ACCOUNT_NUMBER ?? "Contact support for details",
  branch: process.env.OFFLINE_BANK_BRANCH,
  instructions:
    "Transfer the exact amount, then submit your payment details below. We credit your wallet after verification (usually within 24 hours).",
};

export async function getOfflineBankDetails(): Promise<OfflineBankDetails> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: "offline_payment_details" },
  });
  if (row?.value && typeof row.value === "object") {
    const v = row.value as Partial<OfflineBankDetails>;
    return {
      bankName: v.bankName ?? DEFAULT.bankName,
      accountName: v.accountName ?? DEFAULT.accountName,
      accountNumber: v.accountNumber ?? DEFAULT.accountNumber,
      branch: v.branch ?? DEFAULT.branch,
      swiftCode: v.swiftCode,
      instructions: v.instructions ?? DEFAULT.instructions,
    };
  }
  return DEFAULT;
}
