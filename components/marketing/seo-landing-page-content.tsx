import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SeoLandingPage } from "@/lib/marketing/seo-landing-pages";

export function SeoLandingPageContent({ page }: { page: SeoLandingPage }) {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,oklch(0.72_0.19_45/0.15),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl px-4 pt-14 pb-12 md:pt-20 md:pb-16">
          <Link
            href="/solutions"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ← All solutions
          </Link>
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {page.h1}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-2xl">
            {page.excerpt}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={page.primaryCta.href}
              className={cn(buttonVariants({ size: "lg" }), "gap-2 font-semibold")}
            >
              {page.primaryCta.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
            {page.secondaryCta ? (
              <Link
                href={page.secondaryCta.href}
                className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
              >
                {page.secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-14 md:py-16 space-y-12">
        {page.sections.map((section, index) => (
          <article key={index}>
            {section.heading ? (
              <h2 className="text-2xl font-bold tracking-tight">{section.heading}</h2>
            ) : null}
            <div className={cn("space-y-4", section.heading && "mt-4")}>
              {section.paragraphs.map((paragraph, pIndex) => (
                <p key={pIndex} className="text-muted-foreground leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </article>
        ))}

        {page.faqs.length > 0 ? (
          <article>
            <h2 className="text-2xl font-bold tracking-tight">Frequently asked questions</h2>
            <dl className="mt-6 space-y-6">
              {page.faqs.map((faq) => (
                <div key={faq.question} className="rounded-xl border border-border/70 p-5">
                  <dt className="font-semibold">{faq.question}</dt>
                  <dd className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        ) : null}

        {page.relatedLinks.length > 0 ? (
          <article>
            <h2 className="text-2xl font-bold tracking-tight">Related</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {page.relatedLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-2 rounded-lg border border-border/60 px-4 py-3 text-sm font-medium hover:border-primary/30 hover:bg-muted/30 transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        ) : null}
      </section>
    </>
  );
}
