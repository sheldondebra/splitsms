import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { ChangelogContent } from "@/components/marketing/changelog-content";
import { changelogMetadata } from "@/lib/seo/marketing-metadata";

export const metadata: Metadata = changelogMetadata;

export default function ChangelogPage() {
  return (
    <MarketingPageShell>
      <ChangelogContent />
    </MarketingPageShell>
  );
}
