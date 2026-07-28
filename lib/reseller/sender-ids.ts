import { prisma } from "@/lib/db";
import type { SenderIdStatus } from "@/lib/generated/prisma/client";

export type ResellerSenderIdRow = {
  id: string;
  value: string;
  countryCode: string;
  status: SenderIdStatus;
  isDefault: boolean;
  adminNote: string | null;
  providerSubmittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  owner: {
    userId: string;
    fullName: string;
    phone: string;
    isResellerOwner: boolean;
    isSuspended: boolean;
  };
};

export type ResellerSenderIdsDashboard = {
  stats: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  items: ResellerSenderIdRow[];
};

export async function getResellerSenderIdsDashboard(
  resellerId: string,
  resellerUserId: string,
): Promise<ResellerSenderIdsDashboard> {
  const links = await prisma.resellerUser.findMany({
    where: { resellerId },
    select: {
      userId: true,
      isSuspended: true,
      user: { select: { fullName: true, phone: true } },
    },
  });

  const ownerMeta = new Map<
    string,
    { fullName: string; phone: string; isResellerOwner: boolean; isSuspended: boolean }
  >();

  for (const link of links) {
    ownerMeta.set(link.userId, {
      fullName: link.user.fullName,
      phone: link.user.phone,
      isResellerOwner: false,
      isSuspended: link.isSuspended,
    });
  }

  if (!ownerMeta.has(resellerUserId)) {
    const owner = await prisma.user.findUnique({
      where: { id: resellerUserId },
      select: { fullName: true, phone: true },
    });
    if (owner) {
      ownerMeta.set(resellerUserId, {
        fullName: owner.fullName,
        phone: owner.phone,
        isResellerOwner: true,
        isSuspended: false,
      });
    }
  } else {
    const existing = ownerMeta.get(resellerUserId)!;
    ownerMeta.set(resellerUserId, { ...existing, isResellerOwner: true });
  }

  const userIds = [...ownerMeta.keys()];
  if (userIds.length === 0) {
    return {
      stats: { total: 0, approved: 0, pending: 0, rejected: 0 },
      items: [],
    };
  }

  const [rows, groups] = await Promise.all([
    prisma.senderId.findMany({
      where: { userId: { in: userIds } },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 500,
    }),
    prisma.senderId.groupBy({
      by: ["status"],
      where: { userId: { in: userIds } },
      _count: { id: true },
    }),
  ]);

  const countFor = (status: SenderIdStatus) =>
    groups.find((g) => g.status === status)?._count.id ?? 0;

  const stats = {
    total: groups.reduce((sum, g) => sum + g._count.id, 0),
    approved: countFor("APPROVED"),
    pending: countFor("PENDING"),
    rejected: countFor("REJECTED"),
  };

  const items: ResellerSenderIdRow[] = rows.map((row) => {
    const owner = ownerMeta.get(row.userId) ?? {
      fullName: "Unknown",
      phone: "—",
      isResellerOwner: row.userId === resellerUserId,
      isSuspended: false,
    };
    return {
      id: row.id,
      value: row.value,
      countryCode: row.countryCode,
      status: row.status,
      isDefault: row.isDefault,
      adminNote: row.adminNote,
      providerSubmittedAt: row.providerSubmittedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      owner: {
        userId: row.userId,
        fullName: owner.fullName,
        phone: owner.phone,
        isResellerOwner: owner.isResellerOwner,
        isSuspended: owner.isSuspended,
      },
    };
  });

  return { stats, items };
}
