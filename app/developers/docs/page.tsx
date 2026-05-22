import Link from "next/link";
import { ApiDocsView } from "@/components/developers/api-docs-view";
import { BookOpen, Braces } from "lucide-react";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { headers } from "next/headers";

export default async function DevelopersDocsPage() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? `${proto}://${host}`;

  return (
    <AppPage>
      <PageHeader
        title="API Reference"
        description="Complete REST documentation — balance, wallet, SMS, contacts, campaigns, and OTP."
        icon={BookOpen}
        mobileDescription="Expand endpoints for cURL examples."
      />

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
              Download the collection and test endpoints in one click
            </p>
          </div>
        </div>
        <span className="text-sm font-medium text-[#FF6C37] shrink-0">Open →</span>
      </Link>

      <ApiDocsView baseUrl={baseUrl} />
    </AppPage>
  );
}
