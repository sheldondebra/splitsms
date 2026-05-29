import { prisma } from "@/lib/db";
import { getCountryByCode } from "@/lib/countries-data";

export type MemberSource = "direct" | "connect" | "wordpress" | "reseller";

export type MemberSourceFilter = MemberSource | "all" | "external";

const SOURCE_COLORS: Record<MemberSource, string> = {
  connect: "#8b5cf6",
  wordpress: "#0ea5e9",
  reseller: "#f59e0b",
  direct: "#94a3b8",
};

const SOURCE_LABELS: Record<MemberSource, string> = {
  connect: "Connect (API)",
  wordpress: "WordPress",
  reseller: "Reseller",
  direct: "Direct signup",
};

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayLabels(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (count - 1 - i));
    return {
      label: d.toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
      start: (() => {
        const s = new Date();
        s.setDate(s.getDate() - (count - 1 - i));
        s.setHours(0, 0, 0, 0);
        return s;
      })(),
    };
  });
}

export function resolveMemberSource(user: {
  connectCustomerProfile: unknown | null;
  resellerMembership: unknown | null;
  _count: { wordpressSites: number };
}): MemberSource {
  if (user.connectCustomerProfile) return "connect";
  if (user._count.wordpressSites > 0) return "wordpress";
  if (user.resellerMembership) return "reseller";
  return "direct";
}

function sourceWhere(source: MemberSourceFilter) {
  if (source === "all") return {};
  if (source === "external") {
    return {
      OR: [
        { connectCustomerProfile: { isNot: null } },
        { wordpressSites: { some: {} } },
        { resellerMembership: { isNot: null } },
      ],
    };
  }
  if (source === "connect") {
    return { connectCustomerProfile: { isNot: null } };
  }
  if (source === "wordpress") {
    return { wordpressSites: { some: {} } };
  }
  if (source === "reseller") {
    return { resellerMembership: { isNot: null } };
  }
  return {
    connectCustomerProfile: null,
    wordpressSites: { none: {} },
    resellerMembership: null,
  };
}

const memberInclude = {
  wallet: true,
  smsCredit: true,
  memberAccount: true,
  connectCustomerProfile: {
    include: {
      partner: { select: { id: true, fullName: true } },
    },
  },
  resellerMembership: {
    include: {
      reseller: { select: { id: true, businessName: true } },
    },
  },
  wordpressSites: {
    select: { id: true, siteUrl: true, pluginVersion: true, lastSyncAt: true },
    take: 2,
    orderBy: { lastSyncAt: "desc" as const },
  },
  sessions: {
    orderBy: { lastActiveAt: "desc" as const },
    take: 1,
    select: { lastActiveAt: true },
  },
  _count: {
    select: {
      apiKeys: true,
      senderIds: true,
      messages: true,
      wordpressSites: true,
      campaigns: true,
    },
  },
} as const;

export async function getAdminMembersDashboard(params: {
  q?: string;
  source?: string;
}) {
  const query = params.q?.trim();
  const sourceRaw = params.source?.toLowerCase();
  const source: MemberSourceFilter =
    sourceRaw === "connect" ||
    sourceRaw === "wordpress" ||
    sourceRaw === "reseller" ||
    sourceRaw === "direct" ||
    sourceRaw === "external"
      ? sourceRaw
      : "all";

  const memberWhere = {
    role: "MEMBER" as const,
    ...sourceWhere(source),
    ...(query
      ? {
          OR: [
            { fullName: { contains: query, mode: "insensitive" as const } },
            { phone: { contains: query } },
            { email: { contains: query, mode: "insensitive" as const } },
            {
              connectCustomerProfile: {
                externalRef: { contains: query, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };

  const since30 = daysAgo(30);
  const since7 = daysAgo(7);

  const [
    members,
    totalMembers,
    verifiedMembers,
    suspendedMembers,
    newLast7,
    newLast30,
    connectCount,
    wordpressOnlyCount,
    resellerOnlyCount,
    directCount,
    signupsForChart,
    connectLinksRecent,
  ] = await Promise.all([
    prisma.user.findMany({
      where: memberWhere,
      orderBy: { createdAt: "desc" },
      include: memberInclude,
      take: 100,
    }),
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.user.count({ where: { role: "MEMBER", isVerified: true } }),
    prisma.user.count({
      where: {
        role: "MEMBER",
        memberAccount: { status: { in: ["SUSPENDED", "BLOCKED"] } },
      },
    }),
    prisma.user.count({ where: { role: "MEMBER", createdAt: { gte: since7 } } }),
    prisma.user.count({ where: { role: "MEMBER", createdAt: { gte: since30 } } }),
    prisma.user.count({
      where: { role: "MEMBER", connectCustomerProfile: { isNot: null } },
    }),
    prisma.user.count({
      where: {
        role: "MEMBER",
        connectCustomerProfile: null,
        wordpressSites: { some: {} },
      },
    }),
    prisma.user.count({
      where: {
        role: "MEMBER",
        connectCustomerProfile: null,
        wordpressSites: { none: {} },
        resellerMembership: { isNot: null },
      },
    }),
    prisma.user.count({
      where: {
        role: "MEMBER",
        connectCustomerProfile: null,
        wordpressSites: { none: {} },
        resellerMembership: null,
      },
    }),
    prisma.user.findMany({
      where: { role: "MEMBER", createdAt: { gte: since30 } },
      select: { createdAt: true, connectCustomerProfile: { select: { id: true } } },
    }),
    prisma.connectCustomer.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        partner: { select: { fullName: true } },
        customer: { select: { fullName: true, phone: true } },
      },
    }),
  ]);

  const days = dayLabels(30);
  const signupChart = days.map(({ label, start }) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const daySignups = signupsForChart.filter(
      (u) => u.createdAt >= start && u.createdAt < end,
    );
    return {
      date: label,
      signups: daySignups.length,
      connect: daySignups.filter((u) => u.connectCustomerProfile).length,
    };
  });

  const wordpressCount = wordpressOnlyCount;
  const resellerCount = resellerOnlyCount;
  const sourceTotal = connectCount + wordpressOnlyCount + resellerOnlyCount + directCount || 1;

  const sourceChart = (["connect", "wordpress", "reseller", "direct"] as MemberSource[]).map(
    (key) => {
      const count =
        key === "connect"
          ? connectCount
          : key === "wordpress"
            ? wordpressOnlyCount
            : key === "reseller"
              ? resellerOnlyCount
              : directCount;
      return {
        label: SOURCE_LABELS[key],
        key,
        count,
        fill: SOURCE_COLORS[key],
        percent: Math.round((count / sourceTotal) * 100),
      };
    },
  );

  const externalTotal = connectCount + wordpressOnlyCount + resellerOnlyCount;

  const rows = members.map((m) => {
    const src = resolveMemberSource(m);
    const country = getCountryByCode(m.countryCode);
    return {
      id: m.id,
      fullName: m.fullName,
      phone: m.phone,
      email: m.email,
      countryCode: m.countryCode,
      countryName: country?.name ?? m.countryCode,
      createdAt: m.createdAt,
      isVerified: m.isVerified,
      accountStatus: m.memberAccount?.status ?? "ACTIVE",
      credits: m.smsCredit?.balance ?? 0,
      walletBalance: m.wallet?.balance.toNumber() ?? 0,
      walletCurrency: m.wallet?.currency ?? "GHS",
      source: src,
      sourceLabel: SOURCE_LABELS[src],
      connect: m.connectCustomerProfile
        ? {
            externalRef: m.connectCustomerProfile.externalRef,
            label: m.connectCustomerProfile.label,
            partnerId: m.connectCustomerProfile.partner.id,
            partnerName: m.connectCustomerProfile.partner.fullName,
          }
        : null,
      reseller: m.resellerMembership
        ? {
            businessName: m.resellerMembership.reseller.businessName,
            resellerId: m.resellerMembership.reseller.id,
          }
        : null,
      wordpressSites: m.wordpressSites,
      lastActiveAt: m.sessions[0]?.lastActiveAt ?? null,
      counts: m._count,
    };
  });

  return {
    query,
    source,
    stats: {
      totalMembers,
      verifiedMembers,
      suspendedMembers,
      newLast7,
      newLast30,
      externalTotal,
      connectCount,
      wordpressCount,
      resellerCount,
      listed: members.length,
    },
    signupChart,
    sourceChart,
    sourceLabels: SOURCE_LABELS,
    rows,
    recentConnect: connectLinksRecent.map((c) => ({
      id: c.id,
      externalRef: c.externalRef,
      label: c.label,
      partnerName: c.partner.fullName,
      customerName: c.customer.fullName,
      customerPhone: c.customer.phone,
      createdAt: c.createdAt,
    })),
  };
}

export type AdminMembersDashboard = Awaited<ReturnType<typeof getAdminMembersDashboard>>;
