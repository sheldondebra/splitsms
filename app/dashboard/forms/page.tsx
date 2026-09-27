import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getSmartFormsForUser } from "@/lib/smart-forms/queries";
import { getSmartFormLimits } from "@/lib/smart-forms/limits";
import { SmartFormsDashboard } from "@/components/smart-forms/smart-forms-dashboard";
import { FriendlyAlert } from "@/components/dashboard/friendly-alert";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { getSiteUrl } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { FileText, Plus, FileStack } from "lucide-react";
import type { UserRole } from "@/lib/generated/prisma/client";

export default async function SmartFormsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string; error?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const [{ forms }, limits] = await Promise.all([
    getSmartFormsForUser(session.userId, {}),
    getSmartFormLimits(session.userId, session.role as UserRole),
  ]);

  const summary = {
    total: forms.length,
    published: forms.filter((f) => f.status === "PUBLISHED").length,
    draft: forms.filter((f) => f.status === "DRAFT").length,
    submissions: forms.reduce((sum, f) => sum + f.submissions, 0),
  };

  return (
    <AppPage wide>
      <PageHeader
        title="Smart Forms"
        description="Build forms, share short links or QR codes, collect responses, and automate SMS follow-ups."
        icon={FileText}
        mobileDescription="Create forms, share links, collect responses."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Link
              href="/dashboard/forms/templates"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-10 w-full gap-2 rounded-xl md:w-auto",
              )}
            >
              <FileStack className="h-4 w-4" />
              Templates
            </Link>
            <Link
              href={limits.atLimit ? "/dashboard/forms?error=limit" : "/dashboard/forms/create"}
              className={cn(
                buttonVariants({ size: "sm" }),
                "h-10 w-full gap-2 rounded-xl md:w-auto",
                limits.atLimit && "pointer-events-none opacity-60",
              )}
              aria-disabled={limits.atLimit}
            >
              <Plus className="h-4 w-4" />
              Create form
            </Link>
          </div>
        }
      />

      {params.deleted ? (
        <FriendlyAlert success="1" successMessage="Form deleted." />
      ) : null}
      {params.error === "limit" ? (
        <FriendlyAlert error="Form limit reached. Delete an old form or upgrade your plan." />
      ) : params.error ? (
        <FriendlyAlert error="Something went wrong. Please try again." />
      ) : null}

      <SmartFormsDashboard
        forms={forms}
        siteUrl={getSiteUrl()}
        summary={summary}
        limits={limits}
      />
    </AppPage>
  );
}
