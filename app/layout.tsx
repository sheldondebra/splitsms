import type { Metadata } from "next";
import { cookies } from "next/headers";
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
  title: "SplitSMS — Bulk SMS in Ghana & 190+ Countries",
  description:
    "Send bulk SMS campaigns, OTPs, and notifications globally. Modern platform powered by Tecunit Ghana. From GHS 0.029 per message.",
  icons: { icon: "/smslogo.png" },
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
