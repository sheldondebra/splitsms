import Link from "next/link";
import { getSiteUrl } from "@/lib/site-config";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ApiDocsHero } from "@/components/marketing/api-docs-hero";
import { ApiDocsExtras } from "@/components/marketing/api-docs-extras";
import { ApiDocsView } from "@/components/developers/api-docs-view";
import { Braces, BookOpen } from "lucide-react";

export default function ApiDocsPage() {
  const baseUrl = getSiteUrl();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <ApiDocsHero baseUrl={baseUrl} />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          {/* Toolbar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-lg border px-2.5 py-1 font-mono font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                GET
              </span>
              <span className="rounded-lg border px-2.5 py-1 font-mono font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
                POST
              </span>
              <span className="rounded-lg border px-2.5 py-1 font-mono font-semibold bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/20">
                PUT
              </span>
              <span className="rounded-lg border px-2.5 py-1 font-mono font-semibold bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
                DELETE
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <Link
                href="/developers"
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 font-medium hover:bg-muted/50 transition-colors"
              >
                <BookOpen className="h-4 w-4 text-primary" />
                Developer portal
              </Link>
              <Link
                href="/developers/postman"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#FF6C37]/30 bg-[#FF6C37]/5 px-3 py-2 font-medium text-[#FF6C37] hover:bg-[#FF6C37]/10 transition-colors"
              >
                <Braces className="h-4 w-4" />
                Postman
              </Link>
            </div>
          </div>

          {/* Postman promo */}
          <Link
            href="/developers/postman"
            className="group flex items-center justify-between gap-4 rounded-2xl border border-[#FF6C37]/25 bg-[#FF6C37]/5 px-5 py-4 mb-10 transition-all hover:border-[#FF6C37]/40 hover:shadow-md hover:shadow-[#FF6C37]/5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FF6C37]/15 text-[#FF6C37]">
                <Braces className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm group-hover:text-[#FF6C37] transition-colors">
                  Import the Postman collection
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  Test balance, SMS, OTP, contacts, and campaigns without writing curl
                </p>
              </div>
            </div>
            <span className="text-sm font-semibold text-[#FF6C37] shrink-0">Open →</span>
          </Link>

          <div className="rounded-2xl border border-border/60 bg-card/50 p-4 sm:p-6 md:p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight">API reference</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Expand any endpoint for request bodies, responses, and copy-ready cURL.
              </p>
            </div>
            <ApiDocsView baseUrl={baseUrl} />
          </div>

          <ApiDocsExtras />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
