import Link from "next/link";
import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocBlock } from "@/lib/marketing/platform-docs";

function DocParagraph({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return (
    <p className="text-[15px] text-muted-foreground leading-[1.75]">
      {parts.map((part, i) => {
        const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (match) {
          const [, label, href] = match;
          const external = href.startsWith("http");
          return (
            <Link
              key={i}
              href={href}
              className="font-medium text-primary hover:underline"
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {label}
            </Link>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

export function DocBlockRenderer({ block }: { block: DocBlock }) {
  switch (block.type) {
    case "p":
      return <DocParagraph text={block.text} />;
    case "ul":
      return (
        <ul className="list-disc pl-5 space-y-2.5 text-[15px] text-muted-foreground leading-relaxed marker:text-primary/70">
          {block.items.map((item) => (
            <li key={item.slice(0, 48)}>{item}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="list-decimal pl-5 space-y-2.5 text-[15px] text-muted-foreground leading-relaxed marker:font-semibold marker:text-primary/80">
          {block.items.map((item) => (
            <li key={item.slice(0, 48)} className="pl-1">
              {item}
            </li>
          ))}
        </ol>
      );
    case "code":
      return (
        <div className="overflow-hidden rounded-xl border border-border/80 bg-zinc-950 shadow-inner">
          {block.language ? (
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                {block.language}
              </span>
            </div>
          ) : null}
          <pre className="overflow-x-auto p-4 text-xs font-mono leading-relaxed text-zinc-300 sm:text-sm">
            {block.code}
          </pre>
        </div>
      );
    case "note":
      return (
        <div className="flex gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3.5 text-sm">
          <Info className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden />
          <div>
            {block.title ? (
              <p className="font-semibold text-foreground mb-1">{block.title}</p>
            ) : null}
            <p className="text-muted-foreground leading-relaxed">{block.text}</p>
          </div>
        </div>
      );
    case "warning":
      return (
        <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3.5 text-sm dark:bg-amber-500/10">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" aria-hidden />
          <div>
            {block.title ? (
              <p className="font-semibold text-foreground mb-1">{block.title}</p>
            ) : null}
            <p className="text-muted-foreground leading-relaxed">{block.text}</p>
          </div>
        </div>
      );
    case "table":
      return (
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {block.headers.map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className="border-b border-border/50 last:border-0">
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={cn(
                        "px-4 py-3 align-top text-muted-foreground leading-relaxed",
                        ci === 0 && "font-medium text-foreground font-mono text-xs sm:text-sm",
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
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
    <nav
      className="space-y-5 text-sm sidebar-scroll max-h-[calc(100vh-8rem)] overflow-y-auto pr-1"
      aria-label="Documentation"
    >
      {chapters.map((chapter, index) => (
        <div key={chapter.id}>
          <a
            href={`#${chapter.id}`}
            className={cn(
              "group flex items-baseline gap-2 font-semibold mb-2 hover:text-primary transition-colors",
              activeId === chapter.id && "text-primary",
            )}
          >
            <span className="text-[10px] font-bold tabular-nums text-muted-foreground group-hover:text-primary/70">
              {String(index + 1).padStart(2, "0")}
            </span>
            {chapter.title}
          </a>
          <ul className="space-y-1 border-l-2 border-border/80 pl-3 ml-1">
            {chapter.subsections.map((sub) => (
              <li key={sub.id}>
                <a
                  href={`#${sub.id}`}
                  className="text-muted-foreground hover:text-foreground transition-colors block py-1 text-[13px] leading-snug"
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
      className="group rounded-xl border border-border/60 bg-card p-4 hover:border-primary/35 hover:shadow-md hover:shadow-primary/5 transition-all block h-full"
    >
      <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
        {label}
      </p>
      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{desc}</p>
    </Link>
  );
}
