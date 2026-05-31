import Link from "next/link";
import { getSiteUrl, wordpressPlugin } from "@/lib/site-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download, Key, Puzzle, CheckCircle2, BookOpen, History } from "lucide-react";
import { AppPage, PageHeader, AppCard } from "@/components/dashboard/page-shell";
import {
  wordpressIntegrationFeatureGroups,
  wordpressSetupSteps,
  woocommerceTemplatePlaceholders,
} from "@/lib/marketing/wordpress-integration-features";

export default function DevelopersIntegrationsPage() {
  const baseUrl = getSiteUrl();
  const downloadUrl = wordpressPlugin.downloadUrl;

  return (
    <AppPage>
      <PageHeader
        title="WordPress"
        description={`Official plugin v${wordpressPlugin.version} — WooCommerce, forms, Crocoblock, and WordPress core SMS.`}
        icon={Puzzle}
        mobileDescription="Download plugin and configure API key."
      />

      <AppCard className="border-primary/20 bg-gradient-to-br from-primary/5 to-card">
        <CardContent className="pt-8 pb-8 flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Puzzle className="h-7 w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold">SplitSMS for WordPress v{wordpressPlugin.version}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Download from{" "}
              <Link href="/integrations/wordpress" className="text-primary font-medium hover:underline">
                {baseUrl}/integrations/wordpress
              </Link>
              . WordPress checks {baseUrl} for plugin updates automatically.
            </p>
          </div>
          <a href={downloadUrl} className={cn(buttonVariants(), "shrink-0 gap-2")} download>
            <Download className="h-4 w-4" />
            Download plugin
          </a>
        </CardContent>
      </AppCard>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {wordpressIntegrationFeatureGroups.map(({ icon: Icon, title, items }) => (
          <Card key={title} className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Setup (5 minutes)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            {wordpressSetupSteps(baseUrl).map((step, i) => (
              <li key={i}>
                {i === 0 ? (
                  <>
                    <Link href="/developers/api-keys" className="text-primary font-medium hover:underline">
                      Create an API key
                    </Link>{" "}
                    with <strong>sms.send</strong> permission.
                  </>
                ) : (
                  step
                )}
              </li>
            ))}
          </ol>
          <p className="text-xs text-muted-foreground border-t pt-4">
            WooCommerce placeholders:{" "}
            <code className="bg-muted px-1 rounded text-[11px]">{woocommerceTemplatePlaceholders}</code>
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link href="/developers/api-keys" className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
          <Key className="h-4 w-4" />
          API Keys
        </Link>
        <Link href="/docs" className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
          <BookOpen className="h-4 w-4" />
          Documentation
        </Link>
        <Link href="/changelog" className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
          <History className="h-4 w-4" />
          Changelog
        </Link>
        <Link href="/integrations/wordpress" className={cn(buttonVariants({ variant: "ghost" }))}>
          Public setup guide →
        </Link>
      </div>
    </AppPage>
  );
}
