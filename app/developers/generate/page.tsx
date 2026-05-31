import Link from "next/link";
import { FileCode2 } from "lucide-react";
import { IntegrationGenerator } from "@/components/developers/integration-generator";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getApiV1Url, getSiteUrl } from "@/lib/site-config";
import { MessageSquareText } from "lucide-react";

export default function DevelopersGeneratePage() {
  const baseUrl = getSiteUrl();
  const apiV1 = getApiV1Url();

  return (
    <AppPage wide>
      <PageHeader
        title="Generate integration"
        description="Copy env vars and starter code for your stack — built for Cursor, Bolt, and fast AI-assisted builds."
        icon={FileCode2}
        mobileDescription="Stack snippets and .env for vibe coding."
        actions={
          <Link
            href="/developers/prompts"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-10 rounded-xl gap-2")}
          >
            <MessageSquareText className="h-4 w-4" />
            Prompt library
          </Link>
        }
      />
      <IntegrationGenerator baseUrl={baseUrl} apiV1={apiV1} />
    </AppPage>
  );
}
