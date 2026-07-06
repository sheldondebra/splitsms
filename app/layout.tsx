import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getSiteUrl } from "@/lib/site-config";
import { defaultOpenGraphImages, organizationJsonLd, websiteJsonLd } from "@/lib/seo/site";
import { googleSiteVerification } from "@/lib/seo/metadata";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { THEME_COOKIE, resolveThemeClass } from "@/lib/theme";
import "./globals.css";

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
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
    locale: "en",
    images: defaultOpenGraphImages,
  },
  twitter: {
    card: "summary_large_image",
    images: [defaultOpenGraphImages[0].url],
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
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(THEME_COOKIE)?.value;
  const themeClass = resolveThemeClass(themeCookie);

  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} h-full ${themeClass}`}
      suppressHydrationWarning
    >
      <body className="min-h-full font-sans antialiased">
        <JsonLdScript data={[websiteJsonLd, organizationJsonLd]} />
        <ThemeProvider initialTheme={themeCookie}>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
