import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Link2,
  ListOrdered,
  Sparkles,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { IntegrationDef } from "@/lib/marketing/integrations-catalog";
import { getIntegration } from "@/lib/marketing/integrations-catalog";
import { IntegrationLogo } from "@/components/marketing/integration-logo";

export function IntegrationDetailContent({ integration }: { integration: IntegrationDef }) {
  const related = integration.relatedSlugs
    .map((slug) => getIntegration(slug))
    .filter((x): x is IntegrationDef => Boolean(x));

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% -20%, ${integration.brandColor}33, transparent)`,
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-12 md:pt-20 md:pb-16">
          <Link
            href="/integrations"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ← All integrations
          </Link>
          <div className="mt-6 flex flex-col md:flex-row md:items-start gap-8">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-border bg-card p-3 shadow-sm"
              style={{ boxShadow: `0 8px 32px ${integration.brandColor}22` }}
            >
              <IntegrationLogo
                src={integration.logoSrc}
                name={integration.name}
                brandColor={integration.brandColor}
                size="lg"
                className="h-14 w-14"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {integration.name} + SplitSMS
              </h1>
              <p className="mt-2 text-lg text-muted-foreground">{integration.tagline}</p>
              <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl">
                {integration.heroDescription}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {integration.primaryCta.external ? (
                  <a
                    href={integration.primaryCta.href}
                    className={cn(buttonVariants({ size: "lg" }), "gap-2 font-semibold")}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {integration.primaryCta.label}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <Link
                    href={integration.primaryCta.href}
                    className={cn(buttonVariants({ size: "lg" }), "gap-2 font-semibold")}
                  >
                    {integration.primaryCta.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                {integration.secondaryCta ? (
                  <Link
                    href={integration.secondaryCta.href}
                    className={cn(buttonVariants({ size: "lg", variant: "outline" }), "gap-2")}
                  >
                    {integration.secondaryCta.label}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-10">
            <div className="rounded-2xl border border-border/60 bg-card p-6 md:p-8">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Overview
              </h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {integration.overview}
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-6 md:p-8">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                How it works with SplitSMS
              </h2>
              <ul className="mt-4 space-y-3">
                {integration.howSplitSmsWorks.map((line) => (
                  <li key={line} className="flex gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    <span className="leading-relaxed">{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-6 md:p-8">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ListOrdered className="h-5 w-5 text-primary" />
                Setup guide
              </h2>
              <ol className="mt-6 space-y-6">
                {integration.setupSteps.map((step, i) => (
                  <li key={step.title} className="flex gap-4">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: integration.brandColor }}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{step.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-border/60 bg-card p-6 sticky top-24">
              <h3 className="font-semibold">Capabilities</h3>
              <ul className="mt-4 space-y-2">
                {integration.capabilities.map((cap) => (
                  <li
                    key={cap}
                    className="flex gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    {cap}
                  </li>
                ))}
              </ul>
            </div>

            {related.length > 0 ? (
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-6">
                <h3 className="font-semibold text-sm">Related integrations</h3>
                <ul className="mt-4 space-y-3">
                  {related.map((rel) => (
                    <li key={rel.slug}>
                      <Link
                        href={`/integrations/${rel.slug}`}
                        className="flex items-center gap-3 group"
                      >
                        <IntegrationLogo
                          src={rel.logoSrc}
                          name={rel.name}
                          brandColor={rel.brandColor}
                          size="sm"
                          className="h-8 w-8"
                        />
                        <span className="text-sm font-medium group-hover:text-primary transition-colors">
                          {rel.name}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>
      </section>
    </>
  );
}
