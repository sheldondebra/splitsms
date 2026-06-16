import { prisma } from "@/lib/db";

/** Six-digit display ID (100000–999999). */
export function formatAccountNumber(accountNumber: number): string {
  return String(accountNumber).padStart(6, "0");
}

export async function generateUniqueAccountNumber(): Promise<number> {
  for (let attempt = 0; attempt < 24; attempt++) {
    const accountNumber = Math.floor(100_000 + Math.random() * 900_000);
    const exists = await prisma.user.findFirst({
      where: { accountNumber },
      select: { id: true },
    });
    if (!exists) return accountNumber;
  }
  throw new Error("Could not generate a unique account number");
}

/** Assign a number to legacy accounts that do not have one yet. */
export async function ensureUserAccountNumber(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accountNumber: true },
  });
  if (!user) throw new Error("User not found");
  if (user.accountNumber != null) return user.accountNumber;

  const accountNumber = await generateUniqueAccountNumber();
  await prisma.user.update({
    where: { id: userId },
    data: { accountNumber },
  });
  return accountNumber;
}
