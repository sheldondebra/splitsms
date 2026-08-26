import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { HowToPageContent } from "@/components/marketing/how-to-page-content";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import {
  howToFaqs,
  howToItemListJsonLd,
  resolveHowToCategory,
  resolveHowToLevel,
} from "@/lib/marketing/how-to-guides";
import { howToPageMetadata } from "@/lib/seo/marketing-metadata";
import {
  breadcrumbJsonLd,
  faqPageJsonLd,
  organizationJsonLd,
  webPageJsonLd,
  websiteJsonLd,
} from "@/lib/seo/site";

export const metadata: Metadata = howToPageMetadata;

type PageProps = {
  searchParams: Promise<{ topic?: string; q?: string; level?: string; guide?: string }>;
};

export default async function HowToPage({ searchParams }: PageProps) {
  const { topic, q, level, guide } = await searchParams;
  const initialTopic = resolveHowToCategory(topic);
  const initialLevel = resolveHowToLevel(level);

  return (
    <MarketingPageShell>
      <JsonLdScript
        data={[
          websiteJsonLd,
          organizationJsonLd,
          webPageJsonLd({
            name: "How to use SplitSMS — step-by-step guides",
            description:
              "How SplitSMS works: Send SMS, WordPress, WooCommerce, reports, Smart Forms, Google Contacts/Sheets/Forms, API, and wallet.",
            path: "/how-to",
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "How to", path: "/how-to" },
          ]),
          howToItemListJsonLd(),
          faqPageJsonLd(howToFaqs),
        ]}
      />
      <HowToPageContent
        initialTopic={initialTopic}
        initialQuery={q ?? ""}
        initialLevel={initialLevel}
        initialGuide={guide}
      />
    </MarketingPageShell>
  );
}
