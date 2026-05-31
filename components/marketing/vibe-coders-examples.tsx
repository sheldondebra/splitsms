"use client";

import { useState } from "react";
import { CopyButton } from "@/components/developers/copy-button";
import { cn } from "@/lib/utils";

type ExampleTab = {
  id: string;
  label: string;
  filename: string;
  code: string;
};

export function VibeCodersExamples({ tabs }: { tabs: ExampleTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");

  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  if (!current) return null;

  return (
    <div className="rounded-2xl border border-border/80 bg-zinc-950 shadow-xl overflow-hidden">
      <div className="flex flex-wrap gap-1 border-b border-white/10 p-2 bg-zinc-900/80">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              active === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2">
        <span className="text-[11px] font-mono text-zinc-500">{current.filename}</span>
        <CopyButton value={current.code} label="Copy" size="sm" />
      </div>
      <pre className="p-4 text-xs sm:text-sm font-mono text-zinc-300 overflow-x-auto leading-relaxed max-h-[360px] overflow-y-auto">
        {current.code}
      </pre>
    </div>
  );
}
