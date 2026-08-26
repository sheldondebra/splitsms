import type { Metadata } from "next";
import { headers } from "next/headers";
import { getSiteUrl } from "@/lib/site-config";
import { defaultOpenGraphImages, organizationJsonLd, websiteJsonLd } from "@/lib/seo/site";
import { googleSiteVerification, shareDescription, shareTitle } from "@/lib/seo/metadata";
import { shouldIncludeSiteJsonLd } from "@/lib/seo/site-json-ld";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { GoogleAnalyticsScript } from "@/components/analytics/google-analytics-script";
import { loadGa4Config, isGa4TrackingConfigured } from "@/lib/analytics/ga4-config";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeBootstrap } from "@/components/theme-bootstrap";
import ThemeProvider from "@/components/theme-provider";
import "./globals.css";

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const marketing = Bricolage_Grotesque({
  variable: "--font-marketing",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "SplitSMS — Bulk SMS Platform & SMS API | 190+ Countries",
    template: "%s | SplitSMS",
  },
  description:
    "Send bulk SMS, OTP, and marketing campaigns in 190+ countries. Affordable SMS gateway, REST SMS API, webhooks, and pay-as-you-go pricing.",
  applicationName: "SplitSMS",
  category: "technology",
  authors: [{ name: "SplitSMS", url: getSiteUrl() }],
  creator: "SplitSMS",
  publisher: "SplitSMS",
  keywords: [
    "SMS",
    "SMS Ghana",
    "bulk SMS",
    "SMS API",
    "SMS gateway",
    "OTP SMS API",
    "WooCommerce SMS",
    "Paystack SMS",
    "SMS integration",
    "mNotify alternative",
    "Infobip alternative",
    "SplitSMS",
  ],
  openGraph: {
    type: "website",
    siteName: "SplitSMS",
    locale: "en_US",
    url: getSiteUrl(),
    title: shareTitle,
    description: shareDescription,
    images: defaultOpenGraphImages,
  },
  twitter: {
    card: "summary_large_image",
    title: shareTitle,
    description: shareDescription,
    images: [
      {
        url: defaultOpenGraphImages[0].url,
        alt: defaultOpenGraphImages[0].alt,
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: googleSiteVerification(),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16" },
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const headerList = await headers();
  const includeJsonLd = shouldIncludeSiteJsonLd(headerList.get("x-splitsms-pathname"));
  const ga4Config = await loadGa4Config().catch(() => null);

  return (
    <html
      lang="en"
      className={`${sans.variable} ${marketing.variable} ${mono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full font-sans antialiased">
        <ThemeBootstrap />
        {ga4Config && isGa4TrackingConfigured(ga4Config) ? (
          <GoogleAnalyticsScript measurementId={ga4Config.measurementId} />
        ) : null}
        {includeJsonLd ? <JsonLdScript data={[websiteJsonLd, organizationJsonLd]} /> : null}
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
