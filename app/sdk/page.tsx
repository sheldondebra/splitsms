import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { SdkPageContent } from "@/components/marketing/sdk-page-content";
import { getSiteUrl } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "SDKs — JavaScript, PHP & Flutter | SplitSMS Developer Tools",
  description:
    "Official SplitSMS SDKs: npm @splitsms/sdk, Composer splitsms-php, Flutter splitsms_flutter. Send SMS, OTP, and check wallet balance in minutes.",
  keywords: [
    "SplitSMS SDK",
    "SMS API JavaScript",
    "SMS PHP SDK",
    "Flutter SMS",
    "npm splitsms",
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
