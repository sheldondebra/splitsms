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
import { breadcrumbJsonLd, faqPageJsonLd, pricingPageJsonLd } from "@/lib/seo/site";

export const metadata: Metadata = pricingPageMetadata;

const pricingFaqs = [
  {
    question: "How much does bulk SMS cost on SplitSMS?",
    answer:
      "Rates are per SMS segment by destination country. Ghana starts around GHS 0.029. Pay as you go — no monthly minimum.",
  },
  {
    question: "Do I get free credits to try SplitSMS?",
    answer:
      "Yes. New accounts start with 5 SMS credits so you can send a test before topping up your wallet.",
  },
  {
    question: "Is there a contract or monthly fee?",
    answer:
      "No. SplitSMS is pay-as-you-go. Top up when you need to send; unused wallet credit stays on the account.",
  },
  {
    question: "Can I send SMS in Ghana, Nigeria, and other countries?",
    answer:
      "Yes. SplitSMS covers 190+ countries with dashboard, REST API, OTP, and WordPress sending on the same wallet.",
  },
];

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
    <div className="min-h-screen flex flex-col bg-background font-marketing">
      <JsonLdScript
        data={[
          pricingPageJsonLd(),
          faqPageJsonLd(pricingFaqs),
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

          <section className="mt-14 max-w-2xl mx-auto" aria-labelledby="pricing-faq">
            <h2 id="pricing-faq" className="text-xl font-bold tracking-tight text-center">
              Pricing questions
            </h2>
            <div className="mt-6 divide-y divide-border/70 rounded-2xl border border-border/70 bg-card">
              {pricingFaqs.map((faq) => (
                <details key={faq.question} className="group px-5 py-4">
                  <summary className="cursor-pointer list-none font-medium text-sm sm:text-base">
                    {faq.question}
                  </summary>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
