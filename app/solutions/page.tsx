import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { seoLandingPages } from "@/lib/marketing/seo-landing-pages";
import {
  breadcrumbJsonLd,
  organizationJsonLd,
  websiteJsonLd,
  webPageJsonLd,
} from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  title: "SMS Solutions — Ghana Bulk SMS, OTP, WooCommerce & Integrations",
  description:
    "SplitSMS solutions: bulk SMS Ghana, mNotify & Infobip alternatives, OTP API, WooCommerce SMS, Paystack payment texts, SMS integration, and vibe-coder friendly docs.",
  path: "/solutions",
  keywords: [
    "SMS Ghana",
    "bulk SMS solutions",
    "OTP SMS API",
    "WooCommerce SMS",
    "Paystack SMS",
    "SMS integration",
    "mNotify alternative",
    "Infobip alternative",
    "SplitSMS",
  ],
});

export default function SolutionsIndexPage() {
  return (
    <MarketingPageShell>
      <JsonLdScript
        data={[
          websiteJsonLd,
          organizationJsonLd,
          webPageJsonLd({
            name: "SplitSMS Solutions",
            description:
              "Bulk SMS, OTP, WooCommerce, Paystack, and SMS integration guides for Ghana and global teams.",
            path: "/solutions",
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Solutions", path: "/solutions" },
          ]),
        ]}
      />
      <section className="mx-auto max-w-4xl px-4 pt-14 pb-16 md:pt-20">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          SMS solutions for Ghana & global teams
        </h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-2xl">
          Bulk SMS, OTP verification, WooCommerce order alerts, Paystack payment SMS, REST API
          integration, and alternatives to mNotify and Infobip — all on SplitSMS.
        </p>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2">
          {seoLandingPages.map((page) => (
            <li key={page.slug}>
              <Link
                href={`/solutions/${page.slug}`}
                className="group flex flex-col rounded-2xl border border-border/70 p-6 hover:border-primary/30 hover:bg-muted/20 transition-colors h-full"
              >
                <h2 className="text-lg font-bold group-hover:text-primary transition-colors">
                  {page.h1}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">
                  {page.excerpt}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Read guide
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/vibe-coders"
              className="group flex flex-col rounded-2xl border border-border/70 p-6 hover:border-primary/30 hover:bg-muted/20 transition-colors h-full"
            >
              <h2 className="text-lg font-bold group-hover:text-primary transition-colors">
                SMS for vibe coders
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">
                OpenAPI, llms.txt, sandbox keys, and AI prompts for Cursor, Bolt, and fast builds.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Vibe coders hub
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        </ul>
      </section>
    </MarketingPageShell>
  );
}
