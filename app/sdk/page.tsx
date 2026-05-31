import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { SdkPageContent } from "@/components/marketing/sdk-page-content";
import { getSiteUrl } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "SDKs — JavaScript, PHP & Flutter | Install from SplitSMS",
  description:
    "Official SplitSMS SDKs hosted on splitsms.com — npm tarball, Composer repository, and Flutter zip. SMS, OTP, Connect, sender IDs. No third-party registry required.",
  keywords: [
    "SplitSMS SDK",
    "SMS API JavaScript",
    "SMS PHP SDK",
    "Flutter SMS",
    "npm install splitsms",
    "composer splitsms",
    "embed SMS API",
  ],
  alternates: { canonical: "/sdk" },
  openGraph: {
    url: `${getSiteUrl()}/sdk`,
    title: "SplitSMS SDKs for Developers",
  },
};

export default function SdkPage() {
  return (
    <MarketingPageShell>
      <SdkPageContent />
    </MarketingPageShell>
  );
}
