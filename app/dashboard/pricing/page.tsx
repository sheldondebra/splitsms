import { Suspense } from "react";
import { listPublicPricing, pickPricingRow, toPublicPricingRows } from "@/lib/billing/pricing";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { MemberPricingDashboard } from "@/components/dashboard/member-pricing-dashboard";
import { DollarSign } from "lucide-react";

export default async function DashboardPricingPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { country: countryParam } = await searchParams;

  const [dbRows, custom, credit, wallet] = await Promise.all([
    listPublicPricing(),
    prisma.userSmsPricing.findMany({
      where: { userId: session.userId, isActive: true },
    }),
    prisma.smsCredit.findUnique({ where: { userId: session.userId } }),
    prisma.wallet.findUnique({ where: { userId: session.userId } }),
  ]);

  const rows = toPublicPricingRows(dbRows);
  const selected = pickPricingRow(rows, countryParam);
  const selectedCode = selected?.countryCode ?? rows[0]?.countryCode ?? "GH";

  const customRates = custom.map((c) => ({
    countryCode: c.countryCode,
    sellPrice: c.sellPrice.toNumber(),
    currency: c.currency,
  }));

  const smsCredits = credit?.balance ?? 0;
  const walletCurrency = wallet?.currency ?? "GHS";

  return (
    <AppPage wide>
      <PageHeader
        title="SMS pricing"
        description="Compare rates by country, estimate campaign costs, and export your rate card."
        icon={DollarSign}
        mobileDescription="Rates, calculator, and saved estimates."
      />

      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted/40" />}>
        <MemberPricingDashboard
          rows={rows}
          selectedCode={selectedCode}
          customRates={customRates}
          smsCredits={smsCredits}
          walletCurrency={walletCurrency}
        />
      </Suspense>

      <p className="px-4 text-center text-xs text-muted-foreground">
        Platform rates are managed by SplitSMS. Contact support for enterprise or volume pricing.
      </p>
    </AppPage>
  );
}
