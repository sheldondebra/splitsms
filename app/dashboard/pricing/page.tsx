import { Suspense } from "react";
import { listPublicPricing, pickPricingRow, toPublicPricingRows } from "@/lib/billing/pricing";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { AppPage, PageHeader, AppCard } from "@/components/dashboard/page-shell";
import { MemberPricingView } from "@/components/dashboard/member-pricing-view";
import { CardContent } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export default async function DashboardPricingPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { country: countryParam } = await searchParams;

  const [dbRows, custom] = await Promise.all([
    listPublicPricing(),
    prisma.userSmsPricing.findMany({
      where: { userId: session.userId, isActive: true },
    }),
  ]);

  const rows = toPublicPricingRows(dbRows);
  const selected = pickPricingRow(rows, countryParam);
  const selectedCode = selected?.countryCode ?? "GH";

  const customRates = custom.map((c) => ({
    countryCode: c.countryCode,
    sellPrice: c.sellPrice.toNumber(),
    currency: c.currency,
  }));

  return (
    <AppPage medium>
      <PageHeader
        title="SMS pricing"
        description="Per-segment rates by country. Unicode messages may use multiple segments."
        icon={DollarSign}
        mobileDescription="Select a country to see your rate."
      />

      <AppCard>
        <CardContent className="pt-6 pb-6">
          <Suspense fallback={<div className="h-40 rounded-xl bg-muted/40 animate-pulse" />}>
            <MemberPricingView
              rows={rows}
              selectedCode={selectedCode}
              customRates={customRates}
            />
          </Suspense>
        </CardContent>
      </AppCard>

      <p className="text-xs text-muted-foreground text-center px-4">
        Rates are set by SplitSMS administrators. Contact support if you need a custom enterprise
        quote.
      </p>
    </AppPage>
  );
}
