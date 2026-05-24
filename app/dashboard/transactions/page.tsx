import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { getTransactionMeta } from "@/lib/billing/transaction-meta";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { TransactionsDashboard } from "@/components/dashboard/transactions-dashboard";
import { ArrowLeftRight } from "lucide-react";

function computeStats(
  transactions: {
    type: string;
    amount: { toNumber: () => number };
  }[],
) {
  let totalIn = 0;
  let totalOut = 0;
  let topUpCount = 0;
  let smsDebitCount = 0;
  let refundCount = 0;

  for (const t of transactions) {
    const meta = getTransactionMeta(t.type);
    const amount = Math.abs(t.amount.toNumber());
    if (meta.filter === "in") totalIn += amount;
    if (meta.filter === "out") totalOut += amount;
    if (t.type === "WALLET_TOPUP" || t.type === "PROMO_CREDIT") topUpCount += 1;
    if (t.type === "SMS_DEBIT") smsDebitCount += 1;
    if (t.type === "REFUND") refundCount += 1;
  }

  return { totalIn, totalOut, topUpCount, smsDebitCount, refundCount };
}

export default async function TransactionsPage() {
  const session = await getSession();
  if (!session) return null;

  const [wallet, credit, transactions] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: session.userId } }),
    prisma.smsCredit.findUnique({ where: { userId: session.userId } }),
    prisma.transaction.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 250,
    }),
  ]);

  const walletBalance = wallet?.balance.toNumber() ?? 0;
  const walletCurrency = wallet?.currency ?? "GHS";
  const smsCredits = credit?.balance ?? 0;
  const stats = computeStats(transactions);

  const rows = transactions.map((t) => ({
    id: t.id,
    type: t.type,
    amount: t.amount.toNumber(),
    currency: t.currency,
    credits: t.credits,
    description: t.description,
    reference: t.reference,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <AppPage wide>
      <PageHeader
        title="Transactions"
        description="Search, filter, and export your wallet funding, SMS debits, refunds, and bonuses."
        icon={ArrowLeftRight}
        mobileDescription="Full history with search and filters."
      />

      <TransactionsDashboard
        transactions={rows}
        walletBalance={walletBalance}
        walletCurrency={walletCurrency}
        smsCredits={smsCredits}
        stats={stats}
      />
    </AppPage>
  );
}
