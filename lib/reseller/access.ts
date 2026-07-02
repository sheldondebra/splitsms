import { prisma } from "@/lib/db";

export class ResellerAccessError extends Error {
  code: "SUB_USER_SUSPENDED" | "RESELLER_INACTIVE" | "DAILY_LIMIT_USER" | "DAILY_LIMIT_RESELLER";

  constructor(code: ResellerAccessError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

function startOfTodayUtc() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function countUserSmsToday(userId: string) {
  const result = await prisma.message.aggregate({
    where: {
      userId,
      createdAt: { gte: startOfTodayUtc() },
      status: { notIn: ["REJECTED"] },
    },
    _sum: { smsUnits: true },
  });
  return result._sum.smsUnits ?? 0;
}

export async function countResellerSmsToday(resellerId: string) {
  const subIds = await prisma.resellerUser.findMany({
    where: { resellerId },
    select: { userId: true },
  });
  if (subIds.length === 0) return 0;
  const result = await prisma.message.aggregate({
    where: {
      userId: { in: subIds.map((s) => s.userId) },
      createdAt: { gte: startOfTodayUtc() },
      status: { notIn: ["REJECTED"] },
    },
    _sum: { smsUnits: true },
  });
  return result._sum.smsUnits ?? 0;
}

/** Blocks send when sub-user is suspended or daily caps exceeded. */
export async function assertUserCanSendSms(userId: string, units = 1) {
  const membership = await prisma.resellerUser.findUnique({
    where: { userId },
    include: { reseller: true },
  });

  if (!membership) return;

  if (membership.isSuspended) {
    throw new ResellerAccessError(
      "SUB_USER_SUSPENDED",
      "Your reseller account has been suspended. Contact your provider.",
    );
  }

  if (membership.reseller.status !== "APPROVED" || !membership.reseller.isActive) {
    throw new ResellerAccessError(
      "RESELLER_INACTIVE",
      "Reseller partner account is not active.",
    );
  }

  if (membership.dailySmsLimit != null && membership.dailySmsLimit > 0) {
    const sent = await countUserSmsToday(userId);
    if (sent + units > membership.dailySmsLimit) {
      throw new ResellerAccessError(
        "DAILY_LIMIT_USER",
        `Daily SMS limit reached (${membership.dailySmsLimit}/day).`,
      );
    }
  }

  if (membership.reseller.dailySmsLimit != null && membership.reseller.dailySmsLimit > 0) {
    const sent = await countResellerSmsToday(membership.resellerId);
    if (sent + units > membership.reseller.dailySmsLimit) {
      throw new ResellerAccessError(
        "DAILY_LIMIT_RESELLER",
        "Reseller daily SMS cap reached for all sub-users.",
      );
    }
  }
}
