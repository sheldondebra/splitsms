import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { PublicPricingExplorer } from "@/components/marketing/public-pricing-explorer";
import {
  listPublicPricing,
  pickPricingRow,
  toPublicPricingRows,
} from "@/lib/billing/pricing";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DollarSign, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "SMS Pricing by Country — Transparent Bulk SMS Rates | SplitSMS",
  description:
    "View SplitSMS bulk SMS pricing per country. Select your destination, see per-segment rates, credits, and provider. Rates from GHS 0.029 in Ghana. Pay-as-you-go with no hidden fees.",
  alternates: { canonical: "/pricing" },
};

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const { country: countryParam } = await searchParams;
  const dbRows = await listPublicPricing().catch(() => []);
  const rows = toPublicPricingRows(dbRows);

  const selected = pickPricingRow(rows, countryParam);
  const selectedCode = selected?.countryCode ?? "GH";

  const lowest =
    rows.length > 0
      ? rows.reduce((min, r) => (r.memberPrice < min.memberPrice ? r : min), rows[0])
      : null;

  const heroPrice = selected
    ? `${selected.currency} ${selected.memberPrice.toFixed(3)}`
    : lowest
      ? `from ${lowest.currency} ${lowest.memberPrice.toFixed(3)}`
      : "Transparent rates";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-muted/40 to-background">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-15%,oklch(0.72_0.19_45/0.1),transparent)]" />
          <div className="relative mx-auto max-w-4xl px-4 pt-14 pb-10 md:pt-20 text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <DollarSign className="h-3.5 w-3.5" />
              Country-based pricing
            </p>
            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              Pay only for what you send
            </h1>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Select your destination country below. Rates are managed by our team and published
              live — no hidden bundles or annual contracts.
            </p>
            <p className="mt-6 text-2xl sm:text-3xl font-bold text-primary tabular-nums">
              {heroPrice}
              <span className="text-base font-normal text-muted-foreground"> / SMS segment</span>
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16 mx-auto max-w-4xl px-4">
          <Suspense
            fallback={
              <div className="h-64 rounded-2xl border bg-muted/30 animate-pulse" />
            }
          >
            <PublicPricingExplorer
              rows={rows}
              selectedCode={selectedCode}
              lowestPrice={lowest?.memberPrice ?? 0}
              lowestCurrency={lowest?.currency ?? "GHS"}
            />
          </Suspense>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg" }), "gap-2 orange-glow w-full sm:w-auto")}
            >
              Start free — 5 SMS credits
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/features"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }), "w-full sm:w-auto")}
            >
              See all features
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
