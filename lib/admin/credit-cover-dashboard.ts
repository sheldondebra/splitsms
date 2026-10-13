import { prisma } from "@/lib/db";
import { fetchAllSmsProviderBalances } from "@/lib/sms/provider-balances";
import {
  MNOTIFY_LOW_CREDITS_THRESHOLD,
  type LowBalanceAlert,
} from "@/lib/admin/balance-alerts";
import {
  CREDIT_COVER_THRESHOLD_KEY,
  creditCoverStatus,
  holderCreditBreakdown,
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

  const holderIds = topHolders.map((row) => row.user.id);
  const creditFlows = holderIds.length
    ? await prisma.transaction.groupBy({
        by: ["userId", "type"],
        where: {
          userId: { in: holderIds },
          status: "completed",
          type: {
            in: [
              "CREDIT_PURCHASE",
              "PROMO_CREDIT",
              "RESELLER_SUB_FUND",
              "SMS_DEBIT",
              "REFUND",
            ],
          },
        },
        _sum: { credits: true },
      })
    : [];
  const adminAdjustments = holderIds.length
    ? await prisma.transaction.findMany({
        where: {
          userId: { in: holderIds },
          type: "ADMIN_ADJUSTMENT",
          currency: "CREDITS",
          status: "completed",
        },
        select: { userId: true, metadata: true },
      })
    : [];

  const flowByUser = new Map<
    string,
    { purchased: number; promo: number; resellerFund: number; debited: number; refunded: number }
  >();
  for (const id of holderIds) {
    flowByUser.set(id, { purchased: 0, promo: 0, resellerFund: 0, debited: 0, refunded: 0 });
  }
  for (const row of creditFlows) {
    const bucket = flowByUser.get(row.userId);
    if (!bucket) continue;
    const credits = row._sum.credits ?? 0;
    if (row.type === "CREDIT_PURCHASE") bucket.purchased += credits;
    else if (row.type === "PROMO_CREDIT") bucket.promo += credits;
    else if (row.type === "RESELLER_SUB_FUND") bucket.resellerFund += credits;
    else if (row.type === "SMS_DEBIT") bucket.debited += credits;
    else if (row.type === "REFUND") bucket.refunded += credits;
  }
  const adminDeltaByUser = new Map<string, number>();
  for (const row of adminAdjustments) {
    const delta = adminCreditDelta(row.metadata);
    adminDeltaByUser.set(row.userId, (adminDeltaByUser.get(row.userId) ?? 0) + delta);
  }

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
    topHolders: topHolders.map((row) => {
      const flow = flowByUser.get(row.user.id) ?? {
        purchased: 0,
        promo: 0,
        resellerFund: 0,
        debited: 0,
        refunded: 0,
      };
      const usage = holderCreditBreakdown({
        ...flow,
        adminDelta: adminDeltaByUser.get(row.user.id) ?? 0,
        unused: row.balance,
      });
      return {
        userId: row.user.id,
        fullName: row.user.fullName,
        phone: row.user.phone,
        role: row.user.role,
        credits: row.balance,
        bought: usage.bought,
        used: usage.used,
        refunded: usage.refunded,
        unusedPct: usage.unusedPct,
      };
    }),
  };
}

function adminCreditDelta(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return 0;
  const delta = (metadata as { delta?: unknown }).delta;
  return typeof delta === "number" && Number.isFinite(delta) ? delta : 0;
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
