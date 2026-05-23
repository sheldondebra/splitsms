import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { BlogListContent } from "@/components/marketing/blog-list-content";

export const metadata: Metadata = {
  title: "Blog — Bulk SMS Tips, Guides & SMS Marketing",
  description:
    "SplitSMS blog: why your business needs bulk SMS, SMS vs email, choosing an SMS gateway in Ghana, and OTP API guides. Learn and start sending today.",
  keywords: ["bulk SMS blog", "SMS marketing", "SMS Ghana", "SMS API guide", "SplitSMS"],
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <MarketingPageShell>
      <BlogListContent />
    </MarketingPageShell>
  );
}
