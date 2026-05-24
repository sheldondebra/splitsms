import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { BlogListContent } from "@/components/marketing/blog-list-content";

export const metadata: Metadata = {
  title: "Blog — Bulk SMS Tips, Guides, Stories & SMS Marketing",
  description:
    "SplitSMS blog: bulk SMS marketing, WooCommerce SMS, OTP API guides, Ghana & Nigeria SMS pricing, WordPress plugin setup, compliance, and real business stories.",
  keywords: [
    "bulk SMS blog",
    "SMS marketing Ghana",
    "SMS API guide",
    "WooCommerce SMS",
    "OTP SMS",
    "SMS gateway Africa",
    "SplitSMS blog",
    "transactional SMS",
  ],
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "SplitSMS Blog — SMS Marketing & Developer Guides",
    description:
      "Articles on bulk SMS, integrations, compliance, and customer stories for Ghana and Africa.",
    url: "/blog",
    type: "website",
  },
};

export default function BlogPage() {
  return (
    <MarketingPageShell>
      <BlogListContent />
    </MarketingPageShell>
  );
}
