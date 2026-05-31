import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import { VibePromptLibrary } from "@/components/developers/vibe-prompt-library";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { buildVibePrompts } from "@/lib/developers/vibe-prompts";
import { getApiV1Url, getSiteUrl } from "@/lib/site-config";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileCode2 } from "lucide-react";

export default function DevelopersPromptsPage() {
  const baseUrl = getSiteUrl();
  const apiV1 = getApiV1Url();
  const prompts = buildVibePrompts(baseUrl, apiV1);

  return (
    <AppPage wide>
      <PageHeader
        title="AI prompt library"
        description="Copy-paste prompts for Cursor, ChatGPT, and Claude — OTP, SMS, WordPress, Connect, and webhooks."
        icon={MessageSquareText}
        mobileDescription="Vibe coding prompts for SplitSMS."
        actions={
          <Link
            href="/developers/generate"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-10 rounded-xl gap-2")}
          >
            <FileCode2 className="h-4 w-4" />
            Code generator
          </Link>
        }
      />
      <VibePromptLibrary prompts={prompts} />
    </AppPage>
  );
}
