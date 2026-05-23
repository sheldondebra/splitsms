import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { platformDocsChapters, docsQuickLinks } from "@/lib/marketing/platform-docs";
import {
  DocBlockRenderer,
  DocsSidebar,
  DocsQuickLinkCard,
} from "@/components/marketing/docs-parts";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { wordpressPlugin } from "@/lib/site-config";

export function PlatformDocsContent() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-muted/50 via-background to-background">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.72_0.19_45/0.1),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-12 md:pt-20 md:pb-16">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <BookOpen className="h-3.5 w-3.5" />
            Documentation
          </p>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl max-w-3xl">
            SplitSMS documentation
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl leading-relaxed">
            Everything you need to send bulk SMS, use the REST API, connect WordPress and
            WooCommerce, run campaigns, and troubleshoot delivery — from signup to production.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/api-docs" className={cn(buttonVariants({ size: "lg" }), "gap-2 font-semibold")}>
              API reference
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/changelog" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
              Changelog
            </Link>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-12">
            {docsQuickLinks.map((link) => (
              <DocsQuickLinkCard key={link.href} {...link} />
            ))}
          </div>

          <div className="grid gap-10 lg:grid-cols-[240px_1fr] xl:grid-cols-[260px_1fr]">
            <aside className="hidden lg:block">
              <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
                <DocsSidebar chapters={platformDocsChapters} />
              </div>
            </aside>

            <div className="min-w-0 space-y-16">
              {platformDocsChapters.map((chapter) => (
                <article key={chapter.id} id={chapter.id} className="scroll-mt-24">
                  <header className="mb-8 pb-6 border-b border-border/60">
                    <h2 className="text-2xl font-bold tracking-tight">{chapter.title}</h2>
                    <p className="mt-2 text-muted-foreground leading-relaxed">{chapter.description}</p>
                  </header>

                  <div className="space-y-10">
                    {chapter.subsections.map((sub) => (
                      <section key={sub.id} id={sub.id} className="scroll-mt-24">
                        <h3 className="text-lg font-semibold mb-4">{sub.title}</h3>
                        <div className="space-y-4">
                          {sub.blocks.map((block, i) => (
                            <DocBlockRenderer key={`${sub.id}-${i}`} block={block} />
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                </article>
              ))}

              <div className="rounded-2xl border border-border/60 bg-muted/30 p-6 md:p-8">
                <h2 className="text-lg font-semibold">WordPress plugin version</h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Current release: <strong className="text-foreground">v{wordpressPlugin.version}</strong>.
                  See the{" "}
                  <Link href="/changelog" className="text-primary hover:underline">
                    changelog
                  </Link>{" "}
                  for release notes and{" "}
                  <Link href="/integrations/wordpress" className="text-primary hover:underline">
                    WordPress integration guide
                  </Link>{" "}
                  for setup.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
