import Link from "next/link";
import { BookOpen, ArrowRight, FileText, Clock } from "lucide-react";
import {
  platformDocsChapters,
  docsQuickLinks,
  docsMeta,
} from "@/lib/marketing/platform-docs";
import {
  DocBlockRenderer,
  DocsSidebar,
  DocsQuickLinkCard,
} from "@/components/marketing/docs-parts";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { wordpressPlugin } from "@/lib/site-config";

export function PlatformDocsContent() {
  const chapterCount = platformDocsChapters.length;
  const sectionCount = platformDocsChapters.reduce(
    (n, c) => n + c.subsections.length,
    0,
  );

  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-muted/50 via-background to-background">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.72_0.19_45/0.12),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-12 md:pt-20 md:pb-16">
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <BookOpen className="h-3.5 w-3.5" />
              Documentation v{docsMeta.version}
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Updated {docsMeta.lastUpdated}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] max-w-3xl text-foreground">
            SplitSMS platform documentation
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl text-base md:text-lg leading-relaxed">
            Professional guides for sending bulk SMS, operating the dashboard, integrating the
            REST API, connecting WordPress & WooCommerce, and resolving delivery issues — from
            first signup to production.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {chapterCount} chapters · {sectionCount} sections · Maintained by {docsMeta.maintainer}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/api-docs"
              className={cn(buttonVariants({ size: "lg" }), "gap-2 font-semibold")}
            >
              API reference
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/developers/docs"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }), "gap-2")}
            >
              <FileText className="h-4 w-4" />
              Developer portal
            </Link>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-10">
            {docsQuickLinks.map((link) => (
              <DocsQuickLinkCard key={link.href} {...link} />
            ))}
          </div>

          <details className="lg:hidden mb-8 rounded-xl border border-border/60 bg-card px-4 py-3">
            <summary className="cursor-pointer text-sm font-semibold text-foreground min-h-11 flex items-center">
              Table of contents
            </summary>
            <div className="mt-4 pt-4 border-t border-border/60">
              <DocsSidebar chapters={platformDocsChapters} />
            </div>
          </details>

          <div className="grid gap-10 lg:grid-cols-[260px_1fr] xl:grid-cols-[280px_1fr]">
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                  On this page
                </p>
                <DocsSidebar chapters={platformDocsChapters} />
              </div>
            </aside>

            <div className="min-w-0 space-y-20">
              {platformDocsChapters.map((chapter, chapterIndex) => (
                <article key={chapter.id} id={chapter.id} className="scroll-mt-24">
                  <header className="mb-10 pb-6 border-b border-border/60">
                    <p className="text-xs font-bold tabular-nums text-primary mb-2">
                      Chapter {String(chapterIndex + 1).padStart(2, "0")}
                    </p>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      {chapter.title}
                    </h2>
                    <p className="mt-3 text-muted-foreground leading-relaxed max-w-2xl">
                      {chapter.description}
                    </p>
                  </header>

                  <div className="space-y-12">
                    {chapter.subsections.map((sub) => (
                      <section key={sub.id} id={sub.id} className="scroll-mt-24">
                        <h3 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" aria-hidden />
                          {sub.title}
                        </h3>
                        <div className="space-y-5 pl-3.5 border-l-2 border-border/40">
                          {sub.blocks.map((block, i) => (
                            <DocBlockRenderer key={`${sub.id}-${i}`} block={block} />
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                </article>
              ))}

              <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-muted/40 via-card to-card p-6 md:p-8">
                <h2 className="text-lg font-semibold text-foreground">WordPress plugin</h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  Current release:{" "}
                  <strong className="text-foreground">v{wordpressPlugin.version}</strong>. See the{" "}
                  <Link href="/changelog" className="text-primary hover:underline font-medium">
                    changelog
                  </Link>{" "}
                  for release notes, the{" "}
                  <Link
                    href="/integrations/wordpress"
                    className="text-primary hover:underline font-medium"
                  >
                    WordPress integration guide
                  </Link>{" "}
                  for setup, and{" "}
                  <Link
                    href="/dashboard/integrations/wordpress"
                    className="text-primary hover:underline font-medium"
                  >
                    your dashboard
                  </Link>{" "}
                  for connected site stats.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/support" className={cn(buttonVariants({ size: "sm" }), "gap-2")}>
                    Contact support
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/api-docs"
                    className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                  >
                    API reference
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
