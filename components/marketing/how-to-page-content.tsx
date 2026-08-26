"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Clock,
  Filter,
  ListFilter,
  Search,
  Sparkles,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  filterHowToGuides,
  getHowToCategory,
  howToCategories,
  howToFaqs,
  howToGuides,
  howToLevels,
  type HowToCategoryId,
  type HowToGuide,
  type HowToLevel,
} from "@/lib/marketing/how-to-guides";
import { cn } from "@/lib/utils";

type HowToPageContentProps = {
  initialTopic?: string;
  initialQuery?: string;
  initialLevel?: string;
  initialGuide?: string;
};

function categoryLabel(id: HowToCategoryId) {
  return getHowToCategory(id)?.label ?? id;
}

function levelLabel(level: HowToLevel) {
  return howToLevels.find((item) => item.id === level)?.label ?? level;
}

export function HowToPageContent({
  initialTopic = "all",
  initialQuery = "",
  initialLevel = "all",
  initialGuide,
}: HowToPageContentProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<HowToCategoryId | "all">(
    initialTopic as HowToCategoryId | "all",
  );
  const [level, setLevel] = useState<HowToLevel | "all">(
    initialLevel as HowToLevel | "all",
  );
  const [selectedId, setSelectedId] = useState(
    initialGuide || howToGuides[0]?.id || "",
  );

  const results = useMemo(
    () => filterHowToGuides({ query, category, level }),
    [query, category, level],
  );

  const selected = results.find((guide) => guide.id === selectedId) ?? results[0] ?? null;

  useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id);
  }, [selected, selectedId]);

  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.replace(/^#/, "");
      if (id && howToGuides.some((guide) => guide.id === id)) {
        setSelectedId(id);
      }
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("topic", category);
    if (level !== "all") params.set("level", level);
    const trimmed = query.trim();
    if (trimmed) params.set("q", trimmed);
    const qs = params.toString();
    const hash = selected ? `#${selected.id}` : "";
    const next = `/how-to${qs ? `?${qs}` : ""}${hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next !== current) {
      window.history.replaceState(null, "", next);
    }
  }, [category, level, query, selected]);

  function selectGuide(guide: HowToGuide) {
    setSelectedId(guide.id);
    requestAnimationFrame(() => {
      document
        .getElementById("howto-article")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const counts = useMemo(() => {
    const byCategory = Object.fromEntries(
      howToCategories.map((item) => [
        item.id,
        howToGuides.filter((guide) => guide.category === item.id).length,
      ]),
    ) as Record<HowToCategoryId, number>;
    return { total: howToGuides.length, byCategory };
  }, []);

  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-muted/50 via-background to-background">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.72_0.19_45/0.12),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-12 md:pt-20 md:pb-16">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <BookOpen className="h-3.5 w-3.5" />
            How to
          </p>
          <h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            How SplitSMS works — and how to use it.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Step-by-step guides for sending SMS, WordPress and WooCommerce, reports, Smart Forms,
            Google Contacts / Sheets / Forms, the API, and the wallet. Search a job, then follow the
            numbered steps.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {counts.total} guides · {howToCategories.length} categories
          </p>

          <div className="mt-8 max-w-xl">
            <label htmlFor="howto-search" className="sr-only">
              Search how-to guides
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="howto-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search: WooCommerce, Google Forms, delivery report…"
                className="h-12 pl-10 text-base md:text-sm"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/docs" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
              Full documentation
            </Link>
            <Link href="/support" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
              Contact support
            </Link>
          </div>
        </div>
      </section>

      <section className="sticky top-16 z-20 border-b border-border/80 bg-background/90 py-4 backdrop-blur-md md:top-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            Categories
          </div>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="How-to categories">
            <FilterChip
              active={category === "all"}
              onClick={() => setCategory("all")}
              label={`All (${counts.total})`}
            />
            {howToCategories.map((item) => (
              <FilterChip
                key={item.id}
                active={category === item.id}
                onClick={() => setCategory(item.id)}
                label={`${item.label} (${counts.byCategory[item.id]})`}
              />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <ListFilter className="h-3.5 w-3.5" />
              Level
            </span>
            <FilterChip active={level === "all"} onClick={() => setLevel("all")} label="Any" />
            {howToLevels.map((item) => (
              <FilterChip
                key={item.id}
                active={level === item.id}
                onClick={() => setLevel(item.id)}
                label={item.label}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)] lg:items-start">
            <aside>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {results.length === 1 ? "1 guide" : `${results.length} guides`}
                {query.trim() ? ` matching “${query.trim()}”` : ""}
              </p>
              {results.length === 0 ? (
                <div className="rounded-xl border border-border/70 bg-card p-5 text-sm text-muted-foreground">
                  No guides match those filters. Clear search or pick All.
                </div>
              ) : (
                <ul className="space-y-2">
                  {results.map((guide) => {
                    const active = selected?.id === guide.id;
                    return (
                      <li key={guide.id}>
                        <Link
                          href={`/how-to/${guide.id}`}
                          onClick={(event) => {
                            event.preventDefault();
                            selectGuide(guide);
                          }}
                          className={cn(
                            "min-h-11 w-full rounded-xl border px-4 py-3 text-left transition-colors block",
                            active
                              ? "border-primary/40 bg-primary/10 shadow-sm"
                              : "border-border/60 bg-card hover:border-primary/25 hover:bg-muted/40",
                          )}
                        >
                          <span className="block text-sm font-semibold leading-snug text-foreground">
                            {guide.title}
                          </span>
                          <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                            <span>{categoryLabel(guide.category)}</span>
                            <span aria-hidden>·</span>
                            <span>{levelLabel(guide.level)}</span>
                            <span aria-hidden>·</span>
                            <span>{guide.minutes} min</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </aside>

            <article
              id="howto-article"
              className="min-w-0 scroll-mt-28 rounded-2xl border border-border/70 bg-card p-6 shadow-sm md:p-8"
            >
              {selected ? (
                <HowToArticle guide={selected} query={query} />
              ) : (
                <p className="text-sm text-muted-foreground">Choose a guide from the list.</p>
              )}
            </article>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/30 py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Browse by category</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
            Jump straight into a topic. Each card filters this page.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {howToCategories.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setCategory(item.id);
                  setQuery("");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="rounded-xl border border-border/70 bg-background p-4 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.blurb}</p>
                <p className="mt-3 text-[11px] font-medium text-primary">
                  {counts.byCategory[item.id]} guides
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Quick answers</h2>
          <dl className="mt-8 grid gap-6 md:grid-cols-2">
            {howToFaqs.map((faq) => (
              <div key={faq.question} className="rounded-xl border border-border/60 bg-card p-5">
                <dt className="text-sm font-semibold text-foreground">{faq.question}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{faq.answer}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/docs" className={cn(buttonVariants(), "gap-2 font-semibold")}>
              Platform documentation
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/support" className={cn(buttonVariants({ variant: "outline" }))}>
              Still stuck? Email support
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-9 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function HowToArticle({ guide, query }: { guide: HowToGuide; query: string }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
          {categoryLabel(guide.category)}
        </span>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          {levelLabel(guide.level)}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          {guide.minutes} min
        </span>
      </div>
      <h2 className="mt-4 text-2xl font-bold tracking-tight text-balance sm:text-[1.75rem]">
        {guide.title}
      </h2>
      <p className="mt-2">
        <Link
          href={`/how-to/${guide.id}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          Canonical guide page
        </Link>
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
        {guide.summary}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">For {guide.audience}</p>

      <ol className="mt-8 space-y-5">
        {guide.steps.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {index + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <h3 className="text-sm font-semibold text-foreground md:text-base">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      {guide.notes && guide.notes.length > 0 ? (
        <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 px-4 py-4">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Notes
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            {guide.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {query.trim() ? <MatchedSteps guide={guide} query={query.trim()} /> : null}

      <div className="mt-8 border-t border-border/60 pt-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Related
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {guide.related.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(buttonVariants({ size: "sm", variant: "outline" }), "h-9")}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MatchedSteps({ guide, query }: { guide: HowToGuide; query: string }) {
  const q = query.toLowerCase();
  const hits = guide.steps.filter(
    (step) =>
      step.title.toLowerCase().includes(q) || step.body.toLowerCase().includes(q),
  );
  if (hits.length === 0) return null;
  return (
    <p className="mt-6 text-xs text-muted-foreground">
      Search matched {hits.length === 1 ? "1 step" : `${hits.length} steps`} in this guide.
    </p>
  );
}
