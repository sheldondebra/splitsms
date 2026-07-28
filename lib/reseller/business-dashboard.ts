import { prisma } from "@/lib/db";
import { getSubUserIds } from "@/lib/reseller/context";
import { getUnpaidCommissionTotal } from "@/lib/reseller/payout";
import { getOrCreateResellerPaymentSettings } from "@/lib/reseller/payment-settings";
import { checkResellerDomainDns } from "@/lib/reseller/domain-dns-check";

export type ResellerBusinessAlert = {
  id: string;
  tone: "info" | "warning" | "destructive" | "success";
  title: string;
  detail: string;
  href: string;
  count?: number;
};

export type ResellerSetupItem = {
  id: string;
  label: string;
  done: boolean;
  href: string;
  detail: string;
};

export type ResellerBusinessDashboard = {
  business: {
    name: string;
    brandName: string | null;
    domain: string | null;
    commissionRate: number;
    dailySmsLimit: number | null;
    currency: string;
  };
  earnings: {
    walletBalance: number;
    unpaidCommission: number;
    commissionEarned30d: number;
    clientRevenue30d: number;
    fundedToClients30d: number;
    pendingPayoutAmount: number;
    smsInventory: number;
  };
  operations: {
    totalClients: number;
    activeClients: number;
    suspendedClients: number;
    unverifiedClients: number;
    lowCreditClients: number;
    clientCreditsTotal: number;
    clientWalletsTotal: number;
    messages30d: number;
    delivered30d: number;
    failed30d: number;
    deliveryRate: number;
    pendingSenderIds: number;
    failedPayments30d: number;
    pendingPayments: number;
    apiClients: number;
  };
  alerts: ResellerBusinessAlert[];
  setup: {
    score: number;
    items: ResellerSetupItem[];
  };
  lowCreditClients: {
    userId: string;
    fullName: string;
    phone: string;
    credits: number;
  }[];
  recentActivity: {
    payments: { id: string; clientName: string; amount: number; currency: string; status: string; createdAt: string }[];
    commissions: { id: string; source: string; amount: number; currency: string; createdAt: string }[];
  };
};

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getResellerBusinessDashboard(
  resellerId: string,
  resellerUserId: string,
): Promise<ResellerBusinessDashboard> {
  const since30 = daysAgo(29);

  const reseller = await prisma.reseller.findUnique({
    where: { id: resellerId },
    include: {
      user: { include: { wallet: true, smsCredit: true } },
      branding: true,
    },
  });
  if (!reseller) throw new Error("Reseller not found");

  const subUserIds = await getSubUserIds(resellerId);
  const allLinks = await prisma.resellerUser.findMany({
    where: { resellerId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          isVerified: true,
          smsCredit: { select: { balance: true } },
          wallet: { select: { balance: true } },
          _count: { select: { apiKeys: true } },
        },
      },
    },
  });

  const [
    paymentSettings,
    unpaidCommission,
    commissionAgg,
    pendingPayoutAgg,
    paymentStats,
    pendingSenderIds,
    fundingAgg,
    messageGroups,
    recentPayments,
    recentCommissions,
  ] = await Promise.all([
    getOrCreateResellerPaymentSettings(resellerId),
    getUnpaidCommissionTotal(resellerId),
    prisma.resellerCommission.aggregate({
      where: { resellerId, createdAt: { gte: since30 } },
      _sum: { amount: true },
    }),
    prisma.resellerPayoutRequest.aggregate({
      where: { resellerId, status: { in: ["PENDING", "APPROVED", "PROCESSING"] } },
      _sum: { amount: true },
    }),
    subUserIds.length
      ? prisma.payment.groupBy({
          by: ["status"],
          where: { userId: { in: subUserIds }, createdAt: { gte: since30 } },
          _count: { id: true },
          _sum: { amount: true },
        })
      : Promise.resolve([]),
    subUserIds.length
      ? prisma.senderId.count({
          where: { userId: { in: subUserIds }, status: "PENDING" },
        })
      : Promise.resolve(0),
    prisma.transaction.aggregate({
      where: {
        userId: resellerUserId,
        type: "RESELLER_SUB_FUND",
        createdAt: { gte: since30 },
      },
      _sum: { amount: true },
    }),
    subUserIds.length
      ? prisma.message.groupBy({
          by: ["status"],
          where: { userId: { in: subUserIds }, createdAt: { gte: since30 } },
          _count: { id: true },
        })
      : Promise.resolve([]),
    subUserIds.length
      ? prisma.payment.findMany({
          where: { userId: { in: subUserIds } },
          include: { user: { select: { fullName: true } } },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
    prisma.resellerCommission.findMany({
      where: { resellerId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const pricingCount = await prisma.resellerCountryPricing.count({
    where: { resellerId, isActive: true },
  });

  let domainConnected = false;
  if (reseller.domain) {
    const dns = await checkResellerDomainDns(reseller.domain);
    domainConnected = dns.ok;
  }

  const ownGatewayReady = Boolean(
    paymentSettings.checkoutMode === "OWN" &&
      ((paymentSettings.paystackEnabled &&
        paymentSettings.paystackSecretKey &&
        paymentSettings.paystackPublicKey) ||
        (paymentSettings.stripeEnabled &&
          paymentSettings.stripeSecretKey &&
          paymentSettings.stripePublishableKey)),
  );

  const paymentCollectionReady =
    paymentSettings.checkoutMode === "PLATFORM" || ownGatewayReady;

  const statusMap = Object.fromEntries(messageGroups.map((g) => [g.status, g._count.id]));
  const totalMessages = messageGroups.reduce((s, g) => s + g._count.id, 0);
  const delivered =
    (statusMap.DELIVERED ?? 0) + (statusMap.SENT ?? 0);
  const failed = statusMap.FAILED ?? 0;

  const paymentByStatus = Object.fromEntries(
    paymentStats.map((p) => [p.status, { count: p._count.id, sum: p._sum.amount?.toNumber() ?? 0 }]),
  );
  const clientRevenue30d = paymentByStatus.COMPLETED?.sum ?? 0;
  const failedPayments30d = paymentByStatus.FAILED?.count ?? 0;
  const pendingPayments =
    (paymentByStatus.PENDING?.count ?? 0) + (paymentByStatus.CANCELLED?.count ?? 0);

  const suspendedClients = allLinks.filter((l) => l.isSuspended).length;
  const unverifiedClients = allLinks.filter((l) => !l.user.isVerified && !l.isSuspended).length;
  const lowCreditClients = allLinks
    .filter((l) => !l.isSuspended && (l.user.smsCredit?.balance ?? 0) < 50)
    .map((l) => ({
      userId: l.userId,
      fullName: l.user.fullName,
      phone: l.user.phone,
      credits: l.user.smsCredit?.balance ?? 0,
    }))
    .sort((a, b) => a.credits - b.credits)
    .slice(0, 8);

  const apiClients = allLinks.filter((l) => l.user._count.apiKeys > 0).length;
  const clientCreditsTotal = allLinks.reduce(
    (s, l) => s + (l.user.smsCredit?.balance ?? 0),
    0,
  );
  const clientWalletsTotal = allLinks.reduce(
    (s, l) => s + Number(l.user.wallet?.balance ?? 0),
    0,
  );

  const currency = reseller.user.wallet?.currency ?? "GHS";

  const setupItems: ResellerSetupItem[] = [
    {
      id: "brand",
      label: "Branding & domain",
      done: Boolean(
        (reseller.brandName || reseller.businessName) &&
          (reseller.domain || reseller.branding?.logoUrl),
      ),
      href: "/reseller/settings?tab=domain",
      detail: reseller.domain
        ? domainConnected
          ? `${reseller.domain} connected`
          : `${reseller.domain} — DNS not verified`
        : "Add logo and custom domain",
    },
    {
      id: "pricing",
      label: "Country pricing",
      done: pricingCount > 0,
      href: "/reseller/pricing",
      detail: pricingCount > 0 ? `${pricingCount} sell rates set` : "Set your margins",
    },
    {
      id: "payments",
      label: "Payment collection",
      done: paymentCollectionReady,
      href: "/reseller/settings?tab=payments",
      detail:
        paymentSettings.checkoutMode === "OWN"
          ? ownGatewayReady
            ? "Own Paystack/Stripe keys active"
            : "Add your gateway keys"
          : "Using platform checkout",
    },
    {
      id: "payout",
      label: "Payout destination",
      done: Boolean(
        paymentSettings.payoutPhone ||
          (paymentSettings.payoutAccountNumber && paymentSettings.payoutBankName),
      ),
      href: "/reseller/settings?tab=payout",
      detail: "Where we send your withdrawals",
    },
    {
      id: "clients",
      label: "First client",
      done: allLinks.length > 0,
      href: "/reseller/users",
      detail: `${allLinks.length} client${allLinks.length === 1 ? "" : "s"}`,
    },
  ];

  const setupScore = Math.round(
    (setupItems.filter((i) => i.done).length / setupItems.length) * 100,
  );

  const alerts: ResellerBusinessAlert[] = [];

  if (lowCreditClients.length > 0) {
    alerts.push({
      id: "low-credit",
      tone: "warning",
      title: "Low SMS credits",
      detail: `${lowCreditClients.length} client(s) below 50 credits`,
      href: "/reseller/users",
      count: lowCreditClients.length,
    });
  }
  if (unverifiedClients > 0) {
    alerts.push({
      id: "unverified",
      tone: "info",
      title: "Unverified clients",
      detail: "Review and verify new accounts",
      href: "/reseller/users",
      count: unverifiedClients,
    });
  }
  if (pendingSenderIds > 0) {
    alerts.push({
      id: "sender-ids",
      tone: "info",
      title: "Pending sender IDs",
      detail: "Awaiting platform approval",
      href: "/reseller/sender-ids",
      count: pendingSenderIds,
    });
  }
  if (failedPayments30d > 0) {
    alerts.push({
      id: "failed-payments",
      tone: "destructive",
      title: "Failed payments",
      detail: "Client top-ups that did not complete",
      href: "/reseller/payments",
      count: failedPayments30d,
    });
  }
  if (reseller.domain && !domainConnected) {
    alerts.push({
      id: "dns",
      tone: "warning",
      title: "Domain not connected",
      detail: "DNS for your branded login is not verified",
      href: "/reseller/settings?tab=domain",
    });
  }
  if (unpaidCommission > 0) {
    alerts.push({
      id: "commission",
      tone: "success",
      title: "Commission ready",
      detail: `${currency} ${unpaidCommission.toFixed(2)} to transfer to wallet`,
      href: "/reseller/wallet",
    });
  }
  if (paymentSettings.checkoutMode === "OWN" && !ownGatewayReady) {
    alerts.push({
      id: "gateway",
      tone: "warning",
      title: "Gateway keys missing",
      detail: "Own checkout mode selected but keys are incomplete",
      href: "/reseller/settings?tab=payments",
    });
  }
  if (pricingCount === 0) {
    alerts.push({
      id: "pricing",
      tone: "warning",
      title: "No sell rates",
      detail: "Set country pricing to earn margin on SMS",
      href: "/reseller/pricing",
    });
  }

  return {
    business: {
      name: reseller.businessName,
      brandName: reseller.brandName,
      domain: reseller.domain,
      commissionRate: reseller.commissionRate.toNumber(),
      dailySmsLimit: reseller.dailySmsLimit,
      currency,
    },
    earnings: {
      walletBalance: reseller.user.wallet?.balance.toNumber() ?? 0,
      unpaidCommission,
      commissionEarned30d: commissionAgg._sum.amount?.toNumber() ?? 0,
      clientRevenue30d,
      fundedToClients30d: fundingAgg._sum.amount?.toNumber() ?? 0,
      pendingPayoutAmount: pendingPayoutAgg._sum.amount?.toNumber() ?? 0,
      smsInventory: reseller.user.smsCredit?.balance ?? 0,
    },
    operations: {
      totalClients: allLinks.length,
      activeClients: allLinks.length - suspendedClients,
      suspendedClients,
      unverifiedClients,
      lowCreditClients: lowCreditClients.length,
      clientCreditsTotal,
      clientWalletsTotal,
      messages30d: totalMessages,
      delivered30d: delivered,
      failed30d: failed,
      deliveryRate: totalMessages > 0 ? Math.round((delivered / totalMessages) * 100) : 0,
      pendingSenderIds,
      failedPayments30d,
      pendingPayments,
      apiClients,
    },
    alerts,
    setup: { score: setupScore, items: setupItems },
    lowCreditClients,
    recentActivity: {
      payments: recentPayments.map((p) => ({
        id: p.id,
        clientName: p.user.fullName,
        amount: p.amount.toNumber(),
        currency: p.currency,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
      })),
      commissions: recentCommissions.map((c) => ({
        id: c.id,
        source: c.source,
        amount: c.amount.toNumber(),
        currency: c.currency,
        createdAt: c.createdAt.toISOString(),
      })),
    },
  };
}
