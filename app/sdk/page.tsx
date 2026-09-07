import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { SdkPageContent } from "@/components/marketing/sdk-page-content";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { sdkPageMetadata } from "@/lib/seo/marketing-metadata";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/seo/site";

export const metadata: Metadata = sdkPageMetadata;

const sdkDescription =
  "Official SplitSMS SDKs — npm tarball, Composer repository, and Flutter zip. SMS, OTP, Connect, and sender IDs.";

const sdkJsonLd = [
  webPageJsonLd({
    name: "SplitSMS SDKs — JavaScript, PHP & Flutter",
    description: sdkDescription,
    path: "/sdk",
  }),
  breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "SDKs", path: "/sdk" },
  ]),
];

export default function SdkPage() {
  return (
    <MarketingPageShell>
      <JsonLdScript data={sdkJsonLd} />
      <SdkPageContent />
    </MarketingPageShell>
  );
}
