import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getSiteUrl } from "@/lib/site-config";
import { defaultOpenGraphImages } from "@/lib/seo/site";
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
  title: {
    default: "SplitSMS — Bulk SMS Platform & SMS API | Worldwide",
    template: "%s | SplitSMS",
  },
  description:
    "Send bulk SMS, OTP, and marketing campaigns in 190+ countries. Affordable SMS gateway, REST SMS API, and pay-as-you-go pricing.",
  keywords: [
    "SMS",
    "bulk SMS",
    "SMS API",
    "SMS gateway",
    "send SMS",
    "global SMS",
    "SplitSMS",
  ],
  metadataBase: new URL(getSiteUrl()),
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
        <ThemeProvider initialTheme={themeCookie}>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
