import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { HowToGuideArticle } from "@/components/marketing/how-to-guide-article";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { buttonVariants } from "@/components/ui/button";
import {
  getHowToCategory,
  getHowToGuide,
  howToGuides,
  howToJsonLd,
} from "@/lib/marketing/how-to-guides";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, organizationJsonLd, webPageJsonLd, websiteJsonLd } from "@/lib/seo/site";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return howToGuides.map((guide) => ({ slug: guide.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getHowToGuide(slug);
  if (!guide) return { title: "Guide not found" };

  return buildPageMetadata({
    title: `${guide.title} — How to`,
    description: guide.summary,
    path: `/how-to/${guide.id}`,
    keywords: guide.keywords.split(" ").filter(Boolean),
  });
}

export default async function HowToGuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = getHowToGuide(slug);
  if (!guide) notFound();

  const path = `/how-to/${guide.id}`;
  const category = getHowToCategory(guide.category);

  return (
    <MarketingPageShell>
      <JsonLdScript
        data={[
          websiteJsonLd,
          organizationJsonLd,
          webPageJsonLd({
            name: guide.title,
            description: guide.summary,
            path,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "How to", path: "/how-to" },
            { name: guide.title, path },
          ]),
          howToJsonLd(guide),
        ]}
      />
      <article className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <Link
          href={category ? `/how-to?topic=${guide.category}` : "/how-to"}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-8 -ml-2 gap-1.5")}
        >
          <ArrowLeft className="h-4 w-4" />
          All How to guides
        </Link>
        <HowToGuideArticle guide={guide} heading="h1" />
      </article>
    </MarketingPageShell>
  );
}
