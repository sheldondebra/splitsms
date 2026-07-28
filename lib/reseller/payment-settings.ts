import { prisma } from "@/lib/db";
import type {
  ResellerCheckoutMode,
  ResellerPayoutMethod,
  ResellerPayoutStatus,
} from "@/lib/generated/prisma/client";

export async function getOrCreateResellerPaymentSettings(resellerId: string) {
  return prisma.resellerPaymentSettings.upsert({
    where: { resellerId },
    update: {},
    create: { resellerId },
  });
}

export function maskSecret(value: string | null | undefined) {
  if (!value) return "";
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

export async function getResellerAvailablePayoutBalance(resellerUserId: string, resellerId: string) {
  const [wallet, pending] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: resellerUserId } }),
    prisma.resellerPayoutRequest.aggregate({
      where: {
        resellerId,
        status: { in: ["PENDING", "APPROVED", "PROCESSING"] },
      },
      _sum: { amount: true },
    }),
  ]);

  const balance = wallet?.balance.toNumber() ?? 0;
  const reserved = pending._sum.amount?.toNumber() ?? 0;
  return {
    balance,
    reserved,
    available: Math.max(0, balance - reserved),
    currency: wallet?.currency ?? "GHS",
  };
}

export type ResellerPayoutListItem = {
  id: string;
  amount: number;
  currency: string;
  status: ResellerPayoutStatus;
  method: ResellerPayoutMethod;
  phone: string | null;
  accountName: string | null;
  bankName: string | null;
  accountNumber: string | null;
  resellerNote: string | null;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  paidAt: string | null;
  businessName?: string;
  brandName?: string | null;
  resellerId?: string;
};

export async function listResellerPayouts(resellerId: string) {
  const rows = await prisma.resellerPayoutRequest.findMany({
    where: { resellerId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return rows.map((row) => ({
    id: row.id,
    amount: row.amount.toNumber(),
    currency: row.currency,
    status: row.status,
    method: row.method,
    phone: row.phone,
    accountName: row.accountName,
    bankName: row.bankName,
    accountNumber: row.accountNumber,
    resellerNote: row.resellerNote,
    adminNote: row.adminNote,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    paidAt: row.paidAt?.toISOString() ?? null,
  })) satisfies ResellerPayoutListItem[];
}

export async function listAdminResellerPayouts(status?: ResellerPayoutStatus | "ALL") {
  const rows = await prisma.resellerPayoutRequest.findMany({
    where: status && status !== "ALL" ? { status } : undefined,
    include: {
      reseller: {
        select: {
          id: true,
          businessName: true,
          brandName: true,
          user: { select: { fullName: true, phone: true, email: true } },
        },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  return {
    pendingCount: await prisma.resellerPayoutRequest.count({ where: { status: "PENDING" } }),
    items: rows.map((row) => ({
      id: row.id,
      amount: row.amount.toNumber(),
      currency: row.currency,
      status: row.status,
      method: row.method,
      phone: row.phone,
      accountName: row.accountName,
      bankName: row.bankName,
      accountNumber: row.accountNumber,
      resellerNote: row.resellerNote,
      adminNote: row.adminNote,
      createdAt: row.createdAt.toISOString(),
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      paidAt: row.paidAt?.toISOString() ?? null,
      resellerId: row.resellerId,
      businessName: row.reseller.businessName,
      brandName: row.reseller.brandName,
      ownerName: row.reseller.user.fullName,
      ownerPhone: row.reseller.user.phone,
      ownerEmail: row.reseller.user.email,
    })),
  };
}

export type CheckoutMode = ResellerCheckoutMode;
