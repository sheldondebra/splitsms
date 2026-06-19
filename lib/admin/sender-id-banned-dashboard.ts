import { prisma } from "@/lib/db";
import {
  builtInProtectedStats,
  isValueAdminBanned,
  loadSenderIdReservedConfig,
} from "@/lib/sender-ids/reserved-names";
import type { AdminBannedSendersDashboard } from "@/lib/admin/sender-id-banned-types";

export type { AdminBannedSendersDashboard, FlaggedRejectedSender } from "@/lib/admin/sender-id-banned-types";

export async function getAdminBannedSendersDashboard(): Promise<AdminBannedSendersDashboard> {
  const config = await loadSenderIdReservedConfig();

  const rejected = await prisma.senderId.findMany({
    where: { status: "REJECTED" },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      value: true,
      countryCode: true,
      adminNote: true,
      createdAt: true,
      user: { select: { id: true, fullName: true, phone: true } },
    },
  });

  const flaggedRejected = rejected.filter((r) => !isValueAdminBanned(r.value, config));

  return {
    config,
    builtIn: builtInProtectedStats(),
    flaggedRejected,
  };
}
