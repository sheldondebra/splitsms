import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { SeoLandingPageContent } from "@/components/marketing/seo-landing-page-content";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  getAllSeoLandingSlugs,
  getSeoLandingPage,
} from "@/lib/marketing/seo-landing-pages";
import {
  breadcrumbJsonLd,
  organizationJsonLd,
  websiteJsonLd,
  webPageJsonLd,
} from "@/lib/seo/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllSeoLandingSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getSeoLandingPage(slug);
  if (!page) return { title: "Solution not found" };

  return buildPageMetadata({
    title: page.title,
    description: page.excerpt,
    path: `/solutions/${slug}`,
    keywords: page.keywords,
  });
}

export default async function SeoLandingPage({ params }: Props) {
  const { slug } = await params;
  const page = getSeoLandingPage(slug);
  if (!page) notFound();

  const path = `/solutions/${slug}`;

  return (
    <MarketingPageShell>
      <JsonLdScript
        data={[
          websiteJsonLd,
          organizationJsonLd,
          webPageJsonLd({
            name: page.h1,
            description: page.excerpt,
            path,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Solutions", path: "/solutions" },
            { name: page.h1, path },
          ]),
          {
            "@type": "FAQPage",
            mainEntity: page.faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: { "@type": "Answer", text: faq.answer },
            })),
          },
        ]}
      />
      <SeoLandingPageContent page={page} />
    </MarketingPageShell>
  );
}
