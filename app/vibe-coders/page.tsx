import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { VibeCodersPageContent } from "@/components/marketing/vibe-coders-page-content";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbJsonLd,
  faqPageJsonLd,
  organizationJsonLd,
  websiteJsonLd,
  webPageJsonLd,
} from "@/lib/seo/site";

const vibeCoderFaqs = [
  {
    question: "Is SplitSMS good for vibe coders and AI-assisted development?",
    answer:
      "Yes. SplitSMS ships OpenAPI, llms.txt, sandbox API keys, copy-paste code samples, and AI prompts for Cursor, Bolt, and ChatGPT — ship OTP and SMS integration in one session.",
  },
  {
    question: "How do I integrate SMS API with Cursor?",
    answer:
      "Open splitsms.com/vibe-coders for llms.txt and OpenAPI links, create a sandbox API key, and paste the generated fetch/axios snippet into your project. Test OTP send without wallet charges.",
  },
];

export const metadata: Metadata = buildPageMetadata({
  title: "SMS for Vibe Coders — OTP API, OpenAPI & Cursor Integration",
  description:
    "SMS for vibe coders: SplitSMS OpenAPI, llms.txt, sandbox keys, code generator, and AI prompts. Ship OTP and SMS integration with Cursor, Bolt, or ChatGPT — Ghana-ready.",
  path: "/vibe-coders",
  keywords: [
    "SMS for vibe coders",
    "vibe coding SMS API",
    "Cursor SMS integration",
    "AI developer SMS",
    "OTP API Cursor",
    "OpenAPI SMS Ghana",
    "llms.txt SMS API",
    "fast SMS API integration",
    "SplitSMS sandbox",
  ],
});

export default function VibeCodersPage() {
  return (
    <MarketingPageShell>
      <JsonLdScript
        data={[
          websiteJsonLd,
          organizationJsonLd,
          webPageJsonLd({
            name: "SMS for Vibe Coders — SplitSMS",
            description:
              "OpenAPI, llms.txt, sandbox keys, and AI prompts for fast SMS and OTP integration.",
            path: "/vibe-coders",
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Vibe coders", path: "/vibe-coders" },
          ]),
          faqPageJsonLd(vibeCoderFaqs),
        ]}
      />
      <VibeCodersPageContent />
    </MarketingPageShell>
  );
}
