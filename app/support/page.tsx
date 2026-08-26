import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { SupportPageContent } from "@/components/marketing/support-page-content";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { resolveSupportCategory, supportFaqs } from "@/lib/marketing/support-page";
import { supportPageMetadata } from "@/lib/seo/marketing-metadata";
import { supportEmail } from "@/lib/site-config";
import {
  breadcrumbJsonLd,
  faqPageJsonLd,
  organizationJsonLd,
  siteUrl,
  webPageJsonLd,
  websiteJsonLd,
} from "@/lib/seo/site";

export const metadata: Metadata = supportPageMetadata;

type PageProps = {
  searchParams: Promise<{ sent?: string; topic?: string }>;
};

export default async function SupportPage({ searchParams }: PageProps) {
  const { sent, topic } = await searchParams;
  const submitted = sent === "1";

  return (
    <MarketingPageShell>
      <JsonLdScript
        data={[
          websiteJsonLd,
          organizationJsonLd,
          webPageJsonLd({
            name: "SplitSMS Support — Sender ID, billing, API & WordPress help",
            description:
              "Email support for SplitSMS: Sender IDs, failed SMS, wallet top-ups, OTP API, and the WordPress plugin. Accra business hours.",
            path: "/support",
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Support", path: "/support" },
          ]),
          faqPageJsonLd(supportFaqs),
          {
            "@type": "ContactPage",
            "@id": `${siteUrl}/support#contactpage`,
            url: `${siteUrl}/support`,
            name: "SplitSMS Support",
            about: { "@id": `${siteUrl}/#organization` },
          },
          {
            "@type": "ContactPoint",
            contactType: "customer support",
            email: supportEmail,
            url: `${siteUrl}/support`,
            availableLanguage: ["English"],
            areaServed: ["GH", "NG", "Worldwide"],
            hoursAvailable: {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            },
          },
        ]}
      />
      <SupportPageContent submitted={submitted} defaultCategory={resolveSupportCategory(topic)} />
    </MarketingPageShell>
  );
}
