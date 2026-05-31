"use client";

import { useMemo, useState } from "react";
import { MessageSquareText, Bot } from "lucide-react";
import { CopyButton } from "@/components/developers/copy-button";
import { AppCard, AppCardBody } from "@/components/dashboard/page-shell";
import { cn } from "@/lib/utils";
import type { VibePrompt } from "@/lib/developers/vibe-prompts";
import { getVibePromptCategories } from "@/lib/developers/vibe-prompts";

export function VibePromptLibrary({ prompts }: { prompts: VibePrompt[] }) {
  const categories = getVibePromptCategories();
  const [category, setCategory] = useState<string>("All");
  const [expanded, setExpanded] = useState<string | null>(prompts[0]?.id ?? null);

  const filtered = useMemo(
    () =>
      category === "All" ? prompts : prompts.filter((p) => p.category === category),
    [prompts, category],
  );

  return (
    <div className="space-y-6">
      <AppCard className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-background">
        <AppCardBody className="space-y-2">
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
            <Bot className="h-5 w-5" />
            <p className="font-semibold">Copy prompts into Cursor, ChatGPT, or Claude</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Each prompt includes SplitSMS endpoints, env vars, and sandbox notes so AI tools ship
            working code faster. Point your agent at{" "}
            <a href="/llms.txt" className="text-primary hover:underline font-mono text-xs">
              /llms.txt
            </a>{" "}
            or{" "}
            <a href="/openapi.json" className="text-primary hover:underline font-mono text-xs">
              /openapi.json
            </a>{" "}
            for full context.
          </p>
        </AppCardBody>
      </AppCard>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              category === cat
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/60 text-muted-foreground hover:border-primary/30",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((p) => {
          const open = expanded === p.id;
          return (
            <AppCard key={p.id}>
              <AppCardBody className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <MessageSquareText className="h-4 w-4 text-primary shrink-0" />
                      <p className="font-semibold">{p.title}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="rounded-md bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-semibold">
                        {p.category}
                      </span>
                      {p.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <CopyButton value={p.prompt} label="Copy prompt" />
                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : p.id)}
                      className="text-xs font-medium text-primary hover:underline px-2"
                    >
                      {open ? "Hide" : "Preview"}
                    </button>
                  </div>
                </div>
                {open && (
                  <pre className="rounded-xl bg-zinc-950 text-zinc-300 p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto border border-white/10">
                    {p.prompt}
                  </pre>
                )}
              </AppCardBody>
            </AppCard>
          );
        })}
      </div>
    </div>
  );
}
