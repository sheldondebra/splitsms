import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { PlatformDocsContent } from "@/components/marketing/platform-docs-content";
import { getSiteUrl } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Documentation — SplitSMS guides & tutorials",
  description:
    "Professional SplitSMS documentation: getting started, dashboard, messaging standards, REST API, WordPress plugin, security, SDKs, and troubleshooting.",
  alternates: { canonical: "/docs" },
  openGraph: {
    url: `${getSiteUrl()}/docs`,
    title: "SplitSMS Documentation",
  },
};

export default function DocsPage() {
  return (
    <MarketingPageShell>
      <PlatformDocsContent />
    </MarketingPageShell>
  );
}
