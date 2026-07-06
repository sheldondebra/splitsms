import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { SdkPageContent } from "@/components/marketing/sdk-page-content";
import { sdkPageMetadata } from "@/lib/seo/marketing-metadata";

export const metadata: Metadata = sdkPageMetadata;

export default function SdkPage() {
  return (
    <MarketingPageShell>
      <SdkPageContent />
    </MarketingPageShell>
  );
}
