"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ApiEndpointDoc } from "@/lib/developers/api-reference";
import { curlExample } from "@/lib/developers/api-reference";
import { MethodBadge } from "@/components/developers/method-badge";
import { CopyButton } from "@/components/developers/copy-button";
import { cn } from "@/lib/utils";

export function EndpointCard({ endpoint }: { endpoint: ApiEndpointDoc }) {
  const [open, setOpen] = useState(false);
  const curl = curlExample(endpoint.method, endpoint.path, endpoint.body);

  return (
    <div className="rounded-xl border border-border/80 bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-start gap-3 px-4 py-4 text-left hover:bg-muted/40 transition-colors"
      >
        <MethodBadge method={endpoint.method} />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-medium break-all">{endpoint.path}</p>
          <p className="text-sm font-semibold mt-0.5">{endpoint.title}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{endpoint.description}</p>
        </div>
        <ChevronDown
          className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="border-t px-4 py-4 space-y-4 bg-muted/20 text-sm">
          <p className="text-muted-foreground">{endpoint.description}</p>
          <p className="text-xs">
            <span className="font-semibold text-foreground">Permission:</span>{" "}
            <code className="rounded bg-background px-1.5 py-0.5 font-mono">{endpoint.permission}</code>
          </p>
          {endpoint.query && endpoint.query.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-1">Query parameters</p>
              <ul className="text-xs text-muted-foreground list-disc list-inside">
                {endpoint.query.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
          )}
          {endpoint.body && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold">Request body</p>
                <CopyButton value={endpoint.body} label="Copy JSON" size="sm" />
              </div>
              <pre className="rounded-lg bg-zinc-950 text-zinc-100 p-3 text-xs overflow-x-auto font-mono">
                {endpoint.body}
              </pre>
            </div>
          )}
          {endpoint.response && (
            <div>
              <p className="text-xs font-semibold mb-1">Example response</p>
              <pre className="rounded-lg bg-zinc-950 text-zinc-100 p-3 text-xs overflow-x-auto font-mono">
                {endpoint.response}
              </pre>
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold">cURL</p>
              <CopyButton value={curl} label="Copy cURL" size="sm" />
            </div>
            <pre className="rounded-lg bg-zinc-950 text-emerald-300/90 p-3 text-xs overflow-x-auto font-mono whitespace-pre-wrap">
              {curl}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
