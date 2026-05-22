import { prisma } from "@/lib/db";
import type { Reseller, ResellerUser, WhiteLabelBrand } from "@/lib/generated/prisma/client";

export type ResellerContext = Reseller & {
  branding: WhiteLabelBrand | null;
  subUsers: ResellerUser[];
};

export async function getResellerByUserId(userId: string) {
  return prisma.reseller.findUnique({
    where: { userId },
    include: { branding: true, subUsers: true },
  });
}

export async function requireApprovedReseller(userId: string) {
  const reseller = await getResellerByUserId(userId);
  if (!reseller || reseller.status !== "APPROVED" || !reseller.isActive) {
    return null;
  }
  return reseller;
}

export async function getSubUserIds(resellerId: string) {
  const rows = await prisma.resellerUser.findMany({
    where: { resellerId, isSuspended: false },
    select: { userId: true },
  });
  return rows.map((r) => r.userId);
}

export async function assertSubUserBelongsToReseller(
  resellerId: string,
  subUserId: string,
) {
  const link = await prisma.resellerUser.findFirst({
    where: { resellerId, userId: subUserId },
  });
  return Boolean(link && !link.isSuspended);
}

export async function getResellerForMember(userId: string) {
  return prisma.resellerUser.findUnique({
    where: { userId },
    include: { reseller: true },
  });
}

export function isResellerRole(role: string) {
  return role === "RESELLER";
}
