import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { SolutionsPageContent } from "@/components/marketing/solutions-page-content";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { solutionsPageMetadata } from "@/lib/seo/marketing-metadata";
import { breadcrumbJsonLd, organizationJsonLd, websiteJsonLd, webPageJsonLd } from "@/lib/seo/site";

export const metadata: Metadata = solutionsPageMetadata;

export default function SolutionsIndexPage() {
  return (
    <MarketingPageShell>
      <JsonLdScript
        data={[
          websiteJsonLd,
          organizationJsonLd,
          webPageJsonLd({
            name: "SplitSMS Solutions — SMS Platform for Any Organisation",
            description:
              "Bulk SMS, OTP, transactional alerts, Smart Forms, and API. A full messaging platform — not limited to shops, schools, or apps.",
            path: "/solutions",
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Solutions", path: "/solutions" },
          ]),
          {
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Is SplitSMS only for shops, schools, or churches?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No. Those are common examples, not a limit. SplitSMS is a general SMS platform for campaigns, OTP, alerts, forms, and API — including government, utilities, HR, hospitality, and any team that needs to reach a phone.",
                },
              },
              {
                "@type": "Question",
                name: "Can one account cover marketing SMS and OTP?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. Same wallet and Sender ID workflow, different screens and API endpoints for promotional versus transactional traffic.",
                },
              },
            ],
          },
        ]}
      />
      <SolutionsPageContent />
    </MarketingPageShell>
  );
}
