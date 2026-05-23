import Link from "next/link";
import { cn } from "@/lib/utils";
import type { DocBlock } from "@/lib/marketing/platform-docs";

export function DocBlockRenderer({ block }: { block: DocBlock }) {
  switch (block.type) {
    case "p":
      return <p className="text-muted-foreground leading-relaxed">{block.text}</p>;
    case "ul":
      return (
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground text-sm leading-relaxed">
          {block.items.map((item) => (
            <li key={item.slice(0, 40)}>{item}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="list-decimal pl-5 space-y-2 text-muted-foreground text-sm leading-relaxed">
          {block.items.map((item) => (
            <li key={item.slice(0, 40)}>{item}</li>
          ))}
        </ol>
      );
    case "code":
      return (
        <pre className="rounded-xl bg-zinc-950 text-zinc-300 p-4 text-xs font-mono overflow-x-auto leading-relaxed border border-white/10">
          {block.code}
        </pre>
      );
    case "note":
      return (
        <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm">
          {block.title ? (
            <p className="font-semibold text-foreground mb-1">{block.title}</p>
          ) : null}
          <p className="text-muted-foreground leading-relaxed">{block.text}</p>
        </div>
      );
    default:
      return null;
  }
}

export function DocsSidebar({
  chapters,
  activeId,
}: {
  chapters: { id: string; title: string; subsections: { id: string; title: string }[] }[];
  activeId?: string;
}) {
  return (
    <nav className="space-y-6 text-sm" aria-label="Documentation">
      {chapters.map((chapter) => (
        <div key={chapter.id}>
          <a
            href={`#${chapter.id}`}
            className={cn(
              "font-semibold block mb-2 hover:text-primary transition-colors",
              activeId === chapter.id && "text-primary",
            )}
          >
            {chapter.title}
          </a>
          <ul className="space-y-1.5 border-l border-border pl-3 ml-0.5">
            {chapter.subsections.map((sub) => (
              <li key={sub.id}>
                <a
                  href={`#${sub.id}`}
                  className="text-muted-foreground hover:text-foreground transition-colors block py-0.5"
                >
                  {sub.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function DocsQuickLinkCard({
  href,
  label,
  desc,
}: {
  href: string;
  label: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-border/60 bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all block"
    >
      <p className="font-semibold text-sm">{label}</p>
      <p className="text-xs text-muted-foreground mt-1">{desc}</p>
    </Link>
  );
}
