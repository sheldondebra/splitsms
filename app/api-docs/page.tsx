import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { ApiDocsHero } from "@/components/marketing/api-docs-hero";
import { DevelopersDocsGuide } from "@/components/developers/developers-docs-guide";
import { ApiDocsExtras } from "@/components/marketing/api-docs-extras";
import { ApiDocsView } from "@/components/developers/api-docs-view";
import { getSiteUrl } from "@/lib/site-config";
import Link from "next/link";
import { Braces, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function ApiDocsPage() {
  const baseUrl = getSiteUrl();

  return (
    <MarketingPageShell>
      <ApiDocsHero baseUrl={baseUrl} />

      <div className="mx-auto max-w-[1600px] px-6 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-10 md:py-14">
        <div className="max-w-6xl mx-auto">
          <DevelopersDocsGuide baseUrl={baseUrl} />

          <div id="api-reference" className="scroll-mt-24 mt-14 pt-12 border-t border-border/60 space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight">API reference</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  All cURL examples use{" "}
                  <code className="text-xs bg-muted px-1 rounded font-mono">{baseUrl}</code>
                </p>
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

            <div className="rounded-2xl border border-border/60 bg-card/50 p-4 sm:p-6 md:p-8 shadow-sm">
              <ApiDocsView baseUrl={baseUrl} />
            </div>
          </div>

          <ApiDocsExtras />
        </div>
      </div>
    </MarketingPageShell>
  );
}
