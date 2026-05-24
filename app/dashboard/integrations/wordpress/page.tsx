import { getSession } from "@/lib/auth/session";
import { getWordPressIntegrationData } from "@/lib/wordpress/dashboard";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { WordPressIntegrationPanel } from "@/components/dashboard/wordpress-integration-panel";
import { Puzzle, Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { wordpressPlugin } from "@/lib/site-config";

export const metadata = {
  title: "WordPress integration",
};

export default async function WordPressIntegrationsPage() {
  const session = await getSession();
  if (!session) return null;

  const data = await getWordPressIntegrationData(session.userId);

  return (
    <AppPage wide>
      <PageHeader
        title="WordPress"
        description="Monitor sites connected via the SplitSMS plugin — WooCommerce, forms, and Crocoblock."
        icon={Puzzle}
        mobileDescription="Plugin sites, delivery stats, and recent events."
        actions={
          <a
            href={wordpressPlugin.versionedDownloadUrl}
            className={cn(buttonVariants({ size: "sm" }), "gap-2")}
            download
          >
            <Download className="h-4 w-4" />
            Download v{wordpressPlugin.version}
          </a>
        }
      />

      <WordPressIntegrationPanel
        sites={data.sites}
        sentToday={data.sentToday}
        failedToday={data.failedToday}
        sentMonth={data.sentMonth}
        failedMonth={data.failedMonth}
        crocoblock={data.crocoblock}
        recentLogs={data.recentLogs}
      />
    </AppPage>
  );
}
