import Link from "next/link";
import { History } from "lucide-react";
import {
  changelogReleases,
  changelogTypeLabels,
  changelogProductLabels,
  type ChangelogChangeType,
} from "@/lib/marketing/platform-changelog";
import { wordpressPlugin } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const typeStyles: Record<ChangelogChangeType, string> = {
  added: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  changed: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25",
  fixed: "bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-500/25",
  deprecated: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-400 border-zinc-500/25",
  security: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ChangelogContent() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-muted/50 via-background to-background">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.72_0.19_45/0.1),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl px-4 pt-14 pb-12 md:pt-20 md:pb-16 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <History className="h-3.5 w-3.5" />
            Changelog
          </p>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">Release notes</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Detailed history of SplitSMS platform updates and the WordPress plugin. We document
            every meaningful change — features, fixes, and API additions.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Product docs:{" "}
            <Link href="/docs" className="text-primary font-medium hover:underline">
              Full documentation
            </Link>{" "}
            ·{" "}
            <Link href="/api-docs" className="text-primary font-medium hover:underline">
              API reference
            </Link>
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-3xl px-4">
          <div className="relative space-y-0">
            {changelogReleases.map((release, index) => (
              <article
                key={`${release.product}-${release.version}`}
                className={cn(
                  "relative pl-8 pb-12",
                  index !== changelogReleases.length - 1 &&
                    "border-l border-border ml-3",
                )}
              >
                <span
                  className="absolute left-0 top-1.5 -translate-x-1/2 h-3 w-3 rounded-full bg-primary ring-4 ring-background"
                  aria-hidden
                />

                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h2 className="text-xl font-bold tracking-tight">v{release.version}</h2>
                  {release.label ? (
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {release.label}
                    </span>
                  ) : null}
                  <span className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {changelogProductLabels[release.product]}
                  </span>
                </div>

                <time
                  dateTime={release.date}
                  className="text-xs text-muted-foreground font-medium"
                >
                  {formatDate(release.date)}
                </time>

                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {release.summary}
                </p>

                <ul className="mt-5 space-y-3">
                  {release.changes.map((change) => (
                    <li key={change.text.slice(0, 50)} className="flex gap-3 text-sm">
                      <span
                        className={cn(
                          "shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide mt-0.5",
                          typeStyles[change.type],
                        )}
                      >
                        {changelogTypeLabels[change.type]}
                      </span>
                      <span className="text-muted-foreground leading-relaxed">{change.text}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-border/60 bg-muted/30 p-6 text-sm text-muted-foreground leading-relaxed">
            <p>
              WordPress plugin updates appear automatically in your site under{" "}
              <strong className="text-foreground">Plugins → Updates</strong> when a new version is
              published (current release:{" "}
              <strong className="text-foreground">v{wordpressPlugin.version}</strong>). Platform
              changes roll out on splitsms.com without action required.
            </p>
            <p className="mt-3">
              Found a bug?{" "}
              <Link href="/support" className="text-primary font-medium hover:underline">
                Submit a support request
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
