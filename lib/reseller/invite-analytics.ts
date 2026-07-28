import "server-only";

import { prisma } from "@/lib/db";
import type { ResellerClientSignupSource } from "@/lib/generated/prisma/client";

export type ResellerInviteStats = {
  linkViews: number;
  shareViews: number;
  domainViews: number;
  signups: number;
  verifiedSignups: number;
  pendingSignups: number;
  signupsLast7Days: number;
  conversionRate: number | null;
  lastViewedAt: Date | null;
  lastSignupAt: Date | null;
};

export async function recordInviteLinkView(
  resellerId: string,
  source: "share" | "domain",
): Promise<void> {
  await prisma.reseller.update({
    where: { id: resellerId },
    data: {
      inviteLastViewedAt: new Date(),
      ...(source === "share"
        ? { inviteShareViews: { increment: 1 } }
        : { inviteDomainViews: { increment: 1 } }),
    },
  });
}

export async function getResellerInviteStats(
  resellerId: string,
): Promise<ResellerInviteStats> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [reseller, inviteClients] = await Promise.all([
    prisma.reseller.findUnique({
      where: { id: resellerId },
      select: {
        inviteShareViews: true,
        inviteDomainViews: true,
        inviteLastViewedAt: true,
      },
    }),
    prisma.resellerUser.findMany({
      where: {
        resellerId,
        signupSource: { not: "MANUAL" },
      },
      select: {
        createdAt: true,
        user: { select: { isVerified: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const shareViews = reseller?.inviteShareViews ?? 0;
  const domainViews = reseller?.inviteDomainViews ?? 0;
  const linkViews = shareViews + domainViews;
  const signups = inviteClients.length;
  const verifiedSignups = inviteClients.filter((c) => c.user.isVerified).length;
  const pendingSignups = signups - verifiedSignups;
  const signupsLast7Days = inviteClients.filter((c) => c.createdAt >= sevenDaysAgo).length;
  const lastSignupAt = inviteClients[0]?.createdAt ?? null;

  return {
    linkViews,
    shareViews,
    domainViews,
    signups,
    verifiedSignups,
    pendingSignups,
    signupsLast7Days,
    conversionRate:
      linkViews > 0 ? Math.round((signups / linkViews) * 1000) / 10 : null,
    lastViewedAt: reseller?.inviteLastViewedAt ?? null,
    lastSignupAt,
  };
}

export function signupSourceLabel(source: ResellerClientSignupSource): string {
  switch (source) {
    case "INVITE_SHARE":
      return "Signup link";
    case "INVITE_DOMAIN":
      return "Domain signup";
    default:
      return "Manual";
  }
}
