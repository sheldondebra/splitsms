import { prisma } from "@/lib/db";

export async function getEnterpriseByUserId(userId: string) {
  return prisma.enterpriseAccount.findUnique({
    where: { userId },
    include: {
      dedicatedRoute: true,
      smppAccount: true,
      credit: true,
      user: { include: { wallet: true, smsCredit: true } },
    },
  });
}

export function slaUptimePercent(tier: string) {
  switch (tier) {
    case "ENTERPRISE":
      return 99.9;
    case "BUSINESS":
      return 99.5;
    default:
      return 99.0;
  }
}

export function isIpAllowed(clientIp: string | null | undefined, whitelist: string[]) {
  if (!whitelist.length) return true;
  if (!clientIp) return false;
  return whitelist.some((ip) => ip === clientIp || clientIp.startsWith(ip));
}
