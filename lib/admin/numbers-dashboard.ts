import { prisma } from "@/lib/db";
import { getCountryByCode } from "@/lib/countries-data";
import {
  PHONE_NETWORK_LABELS,
  allGhanaKnownNetworkPhoneOr,
  detectPhoneNetwork,
  ghanaNetworkPhoneOr,
  type PhoneNetwork,
} from "@/lib/sms/detect-network";
import { isValidStoredPhone } from "@/lib/sms/phone-validity";
import type { Prisma } from "@/lib/generated/prisma/client";

export const NUMBERS_PAGE_SIZE = 40;
export const NUMBERS_EXPORT_LIMIT = 20_000;

export type NumberSourceFilter = "all" | "members" | "sms";
export type NumberValidityFilter = "all" | "valid" | "invalid";

export type AdminNumberRow = {
  id: string;
  phone: string;
  source: "member" | "sms";
  fullName: string;
  email: string | null;
  memberId: string;
  countryCode: string;
  countryName: string;
  network: PhoneNetwork;
  networkLabel: string;
  isValid: boolean;
  isVerified: boolean | null;
  accountStatus: string | null;
  smsCount: number;
  lastActivityAt: Date;
};

function parseNetwork(raw: string | undefined): PhoneNetwork | "all" {
  const v = raw?.toUpperCase();
  if (v === "MTN" || v === "TELECEL" || v === "AIRTELTIGO" || v === "OTHER" || v === "UNKNOWN") {
    return v;
  }
  return "all";
}

function parseSource(raw: string | undefined): NumberSourceFilter {
  const v = raw?.toLowerCase();
  if (v === "members" || v === "sms") return v;
  return "all";
}

function parseValidity(raw: string | undefined): NumberValidityFilter {
  const v = raw?.toLowerCase();
  if (v === "valid" || v === "invalid") return v;
  return "all";
}

function phoneNetworkOr(
  network: "MTN" | "TELECEL" | "AIRTELTIGO",
): Array<{ recipient: { startsWith: string } }> {
  return ghanaNetworkPhoneOr(network).map((clause) => ({
    recipient: clause.phone,
  }));
}

function memberNetworkWhere(network: PhoneNetwork | "all"): Prisma.UserWhereInput {
  if (network === "all") return {};
  if (network === "MTN" || network === "TELECEL" || network === "AIRTELTIGO") {
    return { OR: ghanaNetworkPhoneOr(network) };
  }
  if (network === "OTHER") {
    return {
      OR: [
        { NOT: { countryCode: "GH" } },
        {
          AND: [
            { countryCode: "GH" },
            { NOT: { OR: allGhanaKnownNetworkPhoneOr() } },
          ],
        },
      ],
    };
  }
  return {};
}

function messageNetworkWhere(network: PhoneNetwork | "all"): Prisma.MessageWhereInput {
  if (network === "all") return {};
  if (network === "MTN" || network === "TELECEL" || network === "AIRTELTIGO") {
    return { OR: phoneNetworkOr(network) };
  }
  if (network === "OTHER") {
    return {
      OR: [
        { NOT: { countryCode: "GH" } },
        { countryCode: null },
        {
          AND: [
            { countryCode: "GH" },
            {
              NOT: {
                OR: allGhanaKnownNetworkPhoneOr().map((c) => ({ recipient: c.phone })),
              },
            },
          ],
        },
      ],
    };
  }
  return {};
}

function matchesNetwork(phone: string, countryCode: string | null | undefined, network: PhoneNetwork | "all") {
  if (network === "all") return true;
  return detectPhoneNetwork(phone, countryCode) === network;
}

function memberSearchWhere(query: string, memberQ: string): Prisma.UserWhereInput[] {
  const bits: Prisma.UserWhereInput[] = [];
  if (query) {
    bits.push({
      OR: [
        { phone: { contains: query, mode: "insensitive" } },
        { fullName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    });
  }
  if (memberQ) {
    const parts = memberQ
      .split("·")
      .map((p) => p.trim())
      .filter(Boolean);
    const needles = parts.length > 0 ? parts : [memberQ];
    bits.push({
      OR: [
        { id: memberQ },
        ...needles.flatMap((needle) => [
          { fullName: { contains: needle, mode: "insensitive" as const } },
          { email: { contains: needle, mode: "insensitive" as const } },
          { phone: { contains: needle, mode: "insensitive" as const } },
        ]),
      ],
    });
  }
  return bits;
}

async function resolveMemberIdsForFilter(memberQ: string): Promise<string[] | null> {
  if (!memberQ) return null;
  const parts = memberQ
    .split("·")
    .map((p) => p.trim())
    .filter(Boolean);
  const needles = parts.length > 0 ? parts : [memberQ];
  const users = await prisma.user.findMany({
    where: {
      role: "MEMBER",
      OR: [
        { id: memberQ },
        ...needles.flatMap((needle) => [
          { fullName: { contains: needle, mode: "insensitive" as const } },
          { email: { contains: needle, mode: "insensitive" as const } },
          { phone: { contains: needle, mode: "insensitive" as const } },
        ]),
      ],
    },
    select: { id: true },
    take: 500,
  });
  return users.map((u) => u.id);
}

export async function getAdminNumbersDashboard(params: {
  q?: string;
  member?: string;
  network?: string;
  country?: string;
  source?: string;
  validity?: string;
  page?: string;
  /** When set, return up to this many rows (for CSV export). */
  exportLimit?: number;
}) {
  const query = params.q?.trim() ?? "";
  const memberQ = params.member?.trim() ?? "";
  const network = parseNetwork(params.network);
  const country = params.country?.trim().toUpperCase() || "all";
  const source = parseSource(params.source);
  const validity = parseValidity(params.validity);
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize =
    params.exportLimit && params.exportLimit > 0
      ? Math.min(NUMBERS_EXPORT_LIMIT, params.exportLimit)
      : NUMBERS_PAGE_SIZE;
  const skip = params.exportLimit ? 0 : (page - 1) * pageSize;

  const memberFilterIds = await resolveMemberIdsForFilter(memberQ);
  if (memberQ && memberFilterIds && memberFilterIds.length === 0) {
    return emptyDashboard({ query, memberQ, network, country, source, validity, page });
  }

  const searchBits = memberSearchWhere(query, "");
  const includeMembers = source === "all" || source === "members";
  const includeSms = source === "all" || source === "sms";

  const memberWhere: Prisma.UserWhereInput = {
    role: "MEMBER",
    phone: { not: "" },
    ...(country !== "all" ? { countryCode: country } : {}),
    ...memberNetworkWhere(network),
    ...(memberFilterIds ? { id: { in: memberFilterIds } } : {}),
    ...(searchBits.length > 0 ? { AND: searchBits } : {}),
  };

  const messageWhere: Prisma.MessageWhereInput = {
    isSandbox: false,
    campaignId: { not: null },
    recipient: { not: "" },
    ...(country !== "all" ? { countryCode: country } : {}),
    ...messageNetworkWhere(network),
    ...(memberFilterIds ? { userId: { in: memberFilterIds } } : {}),
    ...(query
      ? {
          OR: [
            { recipient: { contains: query, mode: "insensitive" } },
            { user: { fullName: { contains: query, mode: "insensitive" } } },
            { user: { phone: { contains: query, mode: "insensitive" } } },
            { user: { email: { contains: query, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [memberRows, recipientGroups, memberOptions, memberCountryGroups, smsCountryGroups] =
    await Promise.all([
      includeMembers
        ? prisma.user.findMany({
            where: memberWhere,
            orderBy: { createdAt: "desc" },
            take: 5000,
            select: {
              id: true,
              phone: true,
              fullName: true,
              email: true,
              countryCode: true,
              isVerified: true,
              createdAt: true,
              memberAccount: { select: { status: true } },
            },
          })
        : Promise.resolve([]),
      includeSms
        ? prisma.message.groupBy({
            by: ["recipient", "userId", "countryCode"],
            where: messageWhere,
            _count: { id: true },
            _max: { createdAt: true },
            orderBy: { _max: { createdAt: "desc" } },
            take: 8000,
          })
        : Promise.resolve([]),
      prisma.user.findMany({
        where: { role: "MEMBER", phone: { not: "" } },
        orderBy: { fullName: "asc" },
        take: 200,
        select: { id: true, fullName: true, phone: true },
      }),
      prisma.user.groupBy({
        by: ["countryCode"],
        where: { role: "MEMBER", phone: { not: "" } },
        _count: { id: true },
      }),
      prisma.message.groupBy({
        by: ["countryCode"],
        where: { isSandbox: false, campaignId: { not: null }, recipient: { not: "" } },
        _count: { id: true },
      }),
    ]);

  const senderIds = [...new Set(recipientGroups.map((g) => g.userId))];
  const senders =
    senderIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: senderIds } },
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            countryCode: true,
          },
        })
      : [];
  const senderMap = new Map(senders.map((s) => [s.id, s]));

  const numbers: AdminNumberRow[] = [];

  for (const u of memberRows) {
    const networkId = detectPhoneNetwork(u.phone, u.countryCode);
    if (!matchesNetwork(u.phone, u.countryCode, network)) continue;
    const isValid = isValidStoredPhone(u.phone, u.countryCode);
    numbers.push({
      id: `member:${u.id}`,
      phone: u.phone,
      source: "member",
      fullName: u.fullName,
      email: u.email,
      memberId: u.id,
      countryCode: u.countryCode,
      countryName: getCountryByCode(u.countryCode)?.name ?? u.countryCode,
      network: networkId,
      networkLabel: PHONE_NETWORK_LABELS[networkId],
      isValid,
      isVerified: u.isVerified,
      accountStatus: u.memberAccount?.status ?? "ACTIVE",
      smsCount: 0,
      lastActivityAt: u.createdAt,
    });
  }

  for (const g of recipientGroups) {
    const sender = senderMap.get(g.userId);
    if (!sender) continue;
    const countryCode = g.countryCode ?? sender.countryCode ?? "GH";
    if (!matchesNetwork(g.recipient, countryCode, network)) continue;
    const networkId = detectPhoneNetwork(g.recipient, countryCode);
    const isValid = isValidStoredPhone(g.recipient, countryCode);
    numbers.push({
      id: `sms:${g.userId}:${g.recipient}`,
      phone: g.recipient,
      source: "sms",
      fullName: sender.fullName,
      email: sender.email,
      memberId: sender.id,
      countryCode,
      countryName: getCountryByCode(countryCode)?.name ?? countryCode,
      network: networkId,
      networkLabel: PHONE_NETWORK_LABELS[networkId],
      isValid,
      isVerified: null,
      accountStatus: null,
      smsCount: g._count.id,
      lastActivityAt: g._max.createdAt ?? new Date(0),
    });
  }

  numbers.sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());

  const validityStats = {
    valid: numbers.filter((n) => n.isValid).length,
    invalid: numbers.filter((n) => !n.isValid).length,
  };

  const filtered =
    validity === "valid"
      ? numbers.filter((n) => n.isValid)
      : validity === "invalid"
        ? numbers.filter((n) => !n.isValid)
        : numbers;

  const total = filtered.length;
  const pageRows = filtered.slice(skip, skip + pageSize);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const networkStats = {
    MTN: filtered.filter((n) => n.network === "MTN").length,
    TELECEL: filtered.filter((n) => n.network === "TELECEL").length,
    AIRTELTIGO: filtered.filter((n) => n.network === "AIRTELTIGO").length,
    OTHER: filtered.filter((n) => n.network === "OTHER" || n.network === "UNKNOWN").length,
    all: total,
  };

  const countryCount = new Map<string, number>();
  for (const g of memberCountryGroups) {
    countryCount.set(g.countryCode, (countryCount.get(g.countryCode) ?? 0) + g._count.id);
  }
  for (const g of smsCountryGroups) {
    const code = g.countryCode ?? "XX";
    countryCount.set(code, (countryCount.get(code) ?? 0) + g._count.id);
  }

  const countries = [...countryCount.entries()]
    .filter(([code]) => code && code !== "XX")
    .map(([code, count]) => ({
      code,
      name: getCountryByCode(code)?.name ?? code,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    numbers: pageRows,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
    filters: {
      q: query,
      member: memberQ,
      network,
      country,
      source,
      validity,
    },
    counts: {
      members: numbers.filter((n) => n.source === "member").length,
      sms: numbers.filter((n) => n.source === "sms").length,
    },
    validityStats,
    countries,
    members: memberOptions.map((m) => ({
      id: m.id,
      label: `${m.fullName} · ${m.phone}`,
    })),
    networkStats,
  };
}

function emptyDashboard(opts: {
  query: string;
  memberQ: string;
  network: PhoneNetwork | "all";
  country: string;
  source: NumberSourceFilter;
  validity: NumberValidityFilter;
  page: number;
}) {
  return {
    numbers: [] as AdminNumberRow[],
    pagination: {
      page: opts.page,
      pageSize: NUMBERS_PAGE_SIZE,
      total: 0,
      totalPages: 1,
    },
    filters: {
      q: opts.query,
      member: opts.memberQ,
      network: opts.network,
      country: opts.country,
      source: opts.source,
      validity: opts.validity,
    },
    counts: { members: 0, sms: 0 },
    validityStats: { valid: 0, invalid: 0 },
    countries: [] as { code: string; name: string; count: number }[],
    members: [] as { id: string; label: string }[],
    networkStats: { MTN: 0, TELECEL: 0, AIRTELTIGO: 0, OTHER: 0, all: 0 },
  };
}

export type AdminNumbersDashboard = Awaited<ReturnType<typeof getAdminNumbersDashboard>>;
