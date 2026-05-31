import Link from "next/link";
import {
  Download,
  Key,
  Puzzle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  BookOpen,
  History,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSiteUrl, wordpressPlugin } from "@/lib/site-config";
import { CopyButton } from "@/components/developers/copy-button";
import {
  wordpressIntegrationFeatureGroups,
  wordpressSetupSteps,
  woocommerceTemplatePlaceholders,
} from "@/lib/marketing/wordpress-integration-features";

export function WordPressIntegrationContent() {
  const baseUrl = getSiteUrl();
  const downloadUrl = wordpressPlugin.versionedDownloadUrl;
  const downloadLabel = wordpressPlugin.versionedDownloadFilename;

  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-muted/50 via-background to-background">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.72_0.19_45/0.1),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-12 md:pt-20 md:pb-16">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Puzzle className="h-3.5 w-3.5" />
            Official WordPress plugin v{wordpressPlugin.version}
          </p>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:max-w-3xl">
            Connect WordPress & WooCommerce to SplitSMS
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl leading-relaxed">
            Order SMS, registration alerts, and form notifications — powered by{" "}
            <strong className="text-foreground">{baseUrl}</strong>. The plugin checks this site
            for updates automatically.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={downloadUrl}
              className={cn(buttonVariants({ size: "lg" }), "gap-2 font-semibold")}
              download
            >
              <Download className="h-4 w-4" />
              Download plugin
            </a>
            <Link
              href="/api-docs"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }), "gap-2")}
            >
              API documentation
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-card p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                Auto-updates from SplitSMS
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                When we release a new plugin version on {baseUrl}, WordPress sites show an
                update in Plugins → Updates — same download URL everywhere.
              </p>
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 max-w-md">
                <code className="text-xs font-mono text-foreground truncate flex-1">
                  {baseUrl}
                </code>
                <CopyButton value={baseUrl} label="Copy" size="sm" />
              </div>
            </div>
            <a href={downloadUrl} className={cn(buttonVariants(), "shrink-0 gap-2")} download>
              <Download className="h-4 w-4" />
              {downloadLabel}
            </a>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {wordpressIntegrationFeatureGroups.map(({ icon: Icon, title, items }) => (
              <div
                key={title}
                className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
              >
                <Icon className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-semibold">{title}</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-border/60 bg-card p-6 md:p-8">
            <h2 className="text-lg font-semibold">Setup in 5 minutes</h2>
            <ol className="mt-4 list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              {wordpressSetupSteps(baseUrl).map((step, i) => (
                <li key={i}>
                  {i === 0 ? (
                    <>
                      <Link href="/signup" className="text-primary font-medium hover:underline">
                        Create a SplitSMS account
                      </Link>{" "}
                      and generate an API key with <strong>sms.send</strong> permission.
                    </>
                  ) : (
                    step
                  )}
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-muted-foreground">
              WooCommerce placeholders:{" "}
              <code className="bg-muted px-1 rounded text-[11px]">{woocommerceTemplatePlaceholders}</code>
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/docs" className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
                <BookOpen className="h-4 w-4" />
                Documentation
              </Link>
              <Link href="/changelog" className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
                <History className="h-4 w-4" />
                Changelog
              </Link>
              <Link href="/integrations/crocoblock" className={cn(buttonVariants({ variant: "outline" }))}>
                Crocoblock guide
              </Link>
              <Link href="/integrations/elementor-pro" className={cn(buttonVariants({ variant: "outline" }))}>
                Elementor Pro
              </Link>
              <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }), "gap-2")}>
                <Key className="h-4 w-4" />
                Log in for API keys
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
