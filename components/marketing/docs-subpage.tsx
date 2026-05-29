import Link from "next/link";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";

export type DocsNavLink = { href: string; label: string };

export function DocsSubpage({
  title,
  description,
  children,
  links,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  links?: DocsNavLink[];
}) {
  const nav: DocsNavLink[] = links ?? [
    { href: "/docs", label: "Overview" },
    { href: "/docs/api", label: "API" },
    { href: "/docs/connect", label: "Connect" },
    { href: "/docs/sdk", label: "SDK" },
    { href: "/docs/wordpress", label: "WordPress" },
    { href: "/docs/mobile", label: "Mobile" },
    { href: "/docs/changelog", label: "Changelog" },
  ];

  return (
    <MarketingPageShell>
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-10 md:py-14">
          <Link
            href="/docs"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1 -ml-2 mb-4 text-muted-foreground",
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            All docs
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-3 text-muted-foreground text-lg leading-relaxed">{description}</p>
          <nav className="mt-6 flex flex-wrap gap-2">
            {nav.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-xs font-medium rounded-full border px-3 py-1 hover:bg-muted transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </section>
      <article className="mx-auto max-w-4xl px-4 py-10 md:py-14 prose prose-neutral dark:prose-invert max-w-none">
        {children}
      </article>
      <section className="border-t py-10">
        <div className="mx-auto max-w-4xl px-4 flex flex-wrap gap-3">
          <Link href="/developers/docs" className={cn(buttonVariants(), "gap-2")}>
            Developer portal
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/api-docs" className={cn(buttonVariants({ variant: "outline" }))}>
            API playground
          </Link>
        </div>
      </section>
    </MarketingPageShell>
  );
}
