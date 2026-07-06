import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SiteHeaderWithAccount } from "@/components/layout/site-header-with-account";
import { SiteFooter } from "@/components/layout/site-footer";
import { PublicPricingExplorer } from "@/components/marketing/public-pricing-explorer";
import { PublicPricingHeroPrice } from "@/components/marketing/public-pricing-hero";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { formatRowPrice } from "@/lib/billing/pricing-format";
import { DEFAULT_COUNTRY_CODE } from "@/lib/constants/defaults";
import {
  listPublicPricing,
  pickPricingRow,
  toPublicPricingRows,
} from "@/lib/billing/pricing";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DollarSign, ArrowRight } from "lucide-react";
import { pricingPageMetadata } from "@/lib/seo/marketing-metadata";
import { breadcrumbJsonLd, pricingPageJsonLd } from "@/lib/seo/site";

export const metadata: Metadata = pricingPageMetadata;

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const { country: countryParam } = await searchParams;
  const dbRows = await listPublicPricing().catch(() => []);
  const rows = toPublicPricingRows(dbRows);

  const selected = pickPricingRow(rows, countryParam);
  const selectedCode = selected?.countryCode ?? DEFAULT_COUNTRY_CODE;

  const lowest =
    rows.length > 0
      ? rows.reduce((min, r) => (r.memberPrice < min.memberPrice ? r : min), rows[0])
      : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <JsonLdScript
        data={[
          pricingPageJsonLd(),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Pricing", path: "/pricing" },
          ]),
        ]}
      />
      <SiteHeaderWithAccount />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-muted/40 to-background">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-15%,oklch(0.72_0.19_45/0.1),transparent)]" />
          <div className="relative mx-auto max-w-5xl px-4 pt-12 pb-8 md:pt-16 md:pb-10 text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <DollarSign className="h-3.5 w-3.5" />
              Transparent SMS pricing
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              See your rate by country
            </h1>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto leading-relaxed text-sm sm:text-base">
              Pick a destination, view the per-segment price, and start sending. No contracts or
              hidden fees.
            </p>
            <p className="mt-5 text-xl sm:text-2xl font-bold text-primary tabular-nums">
              <Suspense
                fallback={
                  <span>
                    {selected
                      ? formatRowPrice(selected)
                      : lowest
                        ? `from ${formatRowPrice(lowest)}`
                        : "Transparent rates"}
                    <span className="text-base font-normal text-muted-foreground">
                      {" "}
                      / SMS segment
                    </span>
                  </span>
                }
              >
                <PublicPricingHeroPrice rows={rows} initialCountryCode={selectedCode} />
              </Suspense>
            </p>
          </div>
        </section>

        <section className="py-10 md:py-14 mx-auto max-w-5xl px-4">
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

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
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
