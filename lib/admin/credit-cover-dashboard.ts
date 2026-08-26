import { prisma } from "@/lib/db";
import { fetchAllSmsProviderBalances } from "@/lib/sms/provider-balances";
import {
  MNOTIFY_LOW_CREDITS_THRESHOLD,
  type LowBalanceAlert,
} from "@/lib/admin/balance-alerts";
import {
  CREDIT_COVER_THRESHOLD_KEY,
  creditCoverStatus,
  parseCreditCoverThreshold,
} from "@/lib/admin/credit-cover";

export async function getCreditCoverThreshold() {
  const row = await prisma.platformSetting.findUnique({
    where: { key: CREDIT_COVER_THRESHOLD_KEY },
  });
  const stored =
    row?.value && typeof row.value === "object"
      ? (row.value as { credits?: unknown }).credits
      : undefined;
  return parseCreditCoverThreshold(stored, MNOTIFY_LOW_CREDITS_THRESHOLD);
}

export async function saveCreditCoverThreshold(credits: number) {
  const value = parseCreditCoverThreshold(credits, MNOTIFY_LOW_CREDITS_THRESHOLD);
  await prisma.platformSetting.upsert({
    where: { key: CREDIT_COVER_THRESHOLD_KEY },
    update: { value: { credits: value } },
    create: { key: CREDIT_COVER_THRESHOLD_KEY, value: { credits: value } },
  });
  return value;
}

async function sumCredits(role: "MEMBER" | "RESELLER" | "ENTERPRISE") {
  const agg = await prisma.smsCredit.aggregate({
    where: { user: { role } },
    _sum: { balance: true },
    _count: true,
  });
  return { credits: agg._sum.balance ?? 0, accounts: agg._count };
}

export async function getCreditCoverDashboard() {
  const [members, resellers, enterprise, balances, threshold, topHolders] =
    await Promise.all([
      sumCredits("MEMBER"),
      sumCredits("RESELLER"),
      sumCredits("ENTERPRISE"),
      fetchAllSmsProviderBalances(),
      getCreditCoverThreshold(),
      prisma.smsCredit.findMany({
        where: { user: { role: { in: ["MEMBER", "RESELLER", "ENTERPRISE"] } } },
        orderBy: { balance: "desc" },
        take: 15,
        select: {
          balance: true,
          user: { select: { id: true, fullName: true, phone: true, role: true } },
        },
      }),
    ]);

  const memberCredits = members.credits + resellers.credits + enterprise.credits;
  const mnotify = balances.find((b) => b.type === "MNOTIFY") ?? null;
  const providerCredits = mnotify?.status === "ok" ? mnotify.amount : null;
  const status = creditCoverStatus({
    providerCredits,
    memberCredits,
    threshold,
  });
  const cover = providerCredits == null ? null : providerCredits - memberCredits;

  return {
    threshold,
    status,
    memberCredits,
    providerCredits,
    cover,
    buckets: {
      members,
      resellers,
      enterprise,
    },
    balances,
    mnotify,
    topHolders: topHolders.map((row) => ({
      userId: row.user.id,
      fullName: row.user.fullName,
      phone: row.user.phone,
      role: row.user.role,
      credits: row.balance,
    })),
  };
}

export type CreditCoverDashboard = Awaited<ReturnType<typeof getCreditCoverDashboard>>;

export async function getCreditCoverSnapshot(
  balances?: Awaited<ReturnType<typeof fetchAllSmsProviderBalances>>,
) {
  const [credits, threshold, resolved] = await Promise.all([
    prisma.smsCredit.aggregate({
      where: { user: { role: { in: ["MEMBER", "RESELLER", "ENTERPRISE"] } } },
      _sum: { balance: true },
    }),
    getCreditCoverThreshold(),
    balances ? Promise.resolve(balances) : fetchAllSmsProviderBalances(),
  ]);

  const memberCredits = credits._sum.balance ?? 0;
  const mnotify = resolved.find((b) => b.type === "MNOTIFY") ?? null;
  const providerCredits = mnotify?.status === "ok" ? mnotify.amount : null;
  const status = creditCoverStatus({
    providerCredits,
    memberCredits,
    threshold,
  });
  const cover = providerCredits == null ? null : providerCredits - memberCredits;

  return {
    threshold,
    status,
    memberCredits,
    providerCredits,
    cover,
  };
}

export type CreditCoverSnapshot = Awaited<ReturnType<typeof getCreditCoverSnapshot>>;

export function creditCoverAlertFromDashboard(
  data: CreditCoverDashboard,
): LowBalanceAlert {
  const provider = data.providerCredits?.toLocaleString() ?? "unknown";
  const members = data.memberCredits.toLocaleString();
  const underwater = data.status === "underwater";
  return {
    kind: "credit_cover",
    title: underwater ? "Member credits exceed SMS stock" : "Main SMS stock is low",
    summary: underwater
      ? `Members hold ${members} SMS credits but provider stock is ${provider}.`
      : `Main SMS stock is ${provider} credits, below the ${data.threshold.toLocaleString()} alert threshold. Members hold ${members}.`,
    provider: data.mnotify?.name ?? "mNotify",
    display: data.mnotify?.display ?? "—",
    amount: data.providerCredits,
    threshold: data.threshold,
    action: underwater
      ? "Top up the SMS provider before members send more traffic than you can deliver."
      : "Top up the main SMS provider, then refresh balances.",
  };
}
