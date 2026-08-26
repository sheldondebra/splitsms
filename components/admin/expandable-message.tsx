"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ExpandableMessage({
  body,
  className,
  collapsedClassName = "line-clamp-1",
}: {
  body: string;
  className?: string;
  collapsedClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const longEnough = body.length > 48 || body.includes("\n");

  return (
    <div className={cn("flex max-w-[280px] items-start gap-1", className)}>
      <p
        className={cn(
          "min-w-0 flex-1 text-muted-foreground break-words whitespace-pre-wrap",
          !open && collapsedClassName,
        )}
      >
        {body}
      </p>
      {longEnough ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-expanded={open}
          aria-label={open ? "Hide full message" : "View full message"}
          title={open ? "Hide full message" : "View full message"}
        >
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      ) : null}
    </div>
  );
}
