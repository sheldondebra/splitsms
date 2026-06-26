import Link from "next/link";
import { ApiDocsView } from "@/components/developers/api-docs-view";
import { DevelopersDocsGuide } from "@/components/developers/developers-docs-guide";
import { BookOpen, Braces } from "lucide-react";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { getSiteUrl } from "@/lib/site-config";

export const metadata = {
  title: "API Documentation",
  description:
    "SplitSMS REST API reference — SMS, OTP, Connect customers, sender IDs, webhooks, and WordPress plugin v1.6.0.",
};

export default function DevelopersDocsPage() {
  const baseUrl = getSiteUrl();

  return (
    <AppPage>
      <PageHeader
        title="Documentation"
        description={`Developer guide and REST API reference — all requests use ${baseUrl}`}
        icon={BookOpen}
        mobileDescription="Setup, WordPress, and endpoint reference."
      />

      <DevelopersDocsGuide baseUrl={baseUrl} />

      <div id="api-reference" className="scroll-mt-24 space-y-6 pt-4 border-t border-border/60">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">API reference</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Expand endpoints for bodies, responses, and copy-ready cURL using{" "}
              <code className="text-xs bg-muted px-1 rounded font-mono">{baseUrl}</code>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-md border px-2 py-1 font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
              GET
            </span>
            <span className="rounded-md border px-2 py-1 font-mono bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
              POST
            </span>
            <span className="rounded-md border px-2 py-1 font-mono bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/20">
              PUT
            </span>
            <span className="rounded-md border px-2 py-1 font-mono bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
              DELETE
            </span>
          </div>
        </div>

        <Link
          href="/developers/postman"
          className="flex items-center justify-between gap-4 rounded-2xl border border-[#FF6C37]/25 bg-[#FF6C37]/5 px-5 py-4 transition-colors hover:bg-[#FF6C37]/10"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6C37]/15 text-[#FF6C37]">
              <Braces className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Prefer Postman?</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Import the collection — baseUrl is preset to {baseUrl}
              </p>
            </div>
          </div>
          <span className="text-sm font-medium text-[#FF6C37] shrink-0">Open →</span>
        </Link>

        <ApiDocsView baseUrl={baseUrl} />
      </div>
    </AppPage>
  );
}
