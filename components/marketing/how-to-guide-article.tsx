import Link from "next/link";
import { Clock, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  getHowToCategory,
  howToLevels,
  type HowToGuide,
} from "@/lib/marketing/how-to-guides";
import { cn } from "@/lib/utils";

function categoryLabel(id: HowToGuide["category"]) {
  return getHowToCategory(id)?.label ?? id;
}

function levelLabel(level: HowToGuide["level"]) {
  return howToLevels.find((item) => item.id === level)?.label ?? level;
}

export function HowToGuideArticle({
  guide,
  heading = "h1",
}: {
  guide: HowToGuide;
  heading?: "h1" | "h2";
}) {
  const Heading = heading;

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
      <Heading className="mt-4 text-2xl font-bold tracking-tight text-balance sm:text-[1.75rem]">
        {guide.title}
      </Heading>
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
