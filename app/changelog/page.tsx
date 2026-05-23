import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { ChangelogContent } from "@/components/marketing/changelog-content";
import { getSiteUrl } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Changelog — SplitSMS release notes",
  description:
    "SplitSMS changelog: platform updates, WordPress plugin releases, API changes, bug fixes, and new features in detail.",
  alternates: { canonical: "/changelog" },
  openGraph: {
    url: `${getSiteUrl()}/changelog`,
    title: "SplitSMS Changelog",
  },
};

export default function ChangelogPage() {
  return (
    <MarketingPageShell>
      <ChangelogContent />
    </MarketingPageShell>
  );
}
