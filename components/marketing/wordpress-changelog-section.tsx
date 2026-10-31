import Link from "next/link";
import { History, ArrowRight } from "lucide-react";
import {
  getReleasesForProduct,
  changelogTypeLabels,
  type ChangelogChangeType,
} from "@/lib/marketing/platform-changelog";
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

export function WordPressChangelogSection({ limit = 5 }: { limit?: number }) {
  const releases = getReleasesForProduct("wordpress").slice(0, limit);
  if (releases.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          What&apos;s new in the plugin
        </h2>
        <Link
          href="/changelog"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Full changelog
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-6 space-y-0">
        {releases.map((release, index) => (
          <article
            key={release.version}
            className={cn(
              "relative pl-6 pb-8",
              index !== releases.length - 1 && "border-l border-border ml-2",
            )}
          >
            <span
              className="absolute left-0 top-1.5 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-card"
              aria-hidden
            />
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">v{release.version}</h3>
              <time dateTime={release.date} className="text-xs text-muted-foreground">
                {formatDate(release.date)}
              </time>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              {release.summary}
            </p>
            <ul className="mt-3 space-y-1.5">
              {release.changes.map((change) => (
                <li key={change.text.slice(0, 50)} className="flex gap-2 text-sm">
                  <span
                    className={cn(
                      "shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide mt-0.5",
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
    </div>
  );
}
