"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { getMessagePreview } from "@/lib/sms/message-preview";
import {
  personalizeMessage,
  SMS_PREVIEW_SAMPLE,
  TEMPLATE_VARIABLES,
  type PersonalizationVars,
} from "@/lib/sms/personalize";
import { cn } from "@/lib/utils";
import { Battery, Signal, Wifi } from "lucide-react";

type SmsPreviewProps = {
  message: string;
  senderLabel?: string;
  sampleVars?: PersonalizationVars;
  className?: string;
  compact?: boolean;
  showMeta?: boolean;
  showVariableHints?: boolean;
  title?: string;
};

export function SmsPreview({
  message,
  senderLabel = "SplitSMS",
  sampleVars,
  className,
  compact,
  showMeta = true,
  showVariableHints = true,
  title = "Live preview",
}: SmsPreviewProps) {
  const resolved = useMemo(
    () => personalizeMessage(message, { ...SMS_PREVIEW_SAMPLE, ...sampleVars }),
    [message, sampleVars],
  );
  const meta = useMemo(() => getMessagePreview(resolved), [resolved]);
  const hasMessage = resolved.trim().length > 0;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            How your SMS will look on a phone
          </p>
        </div>
        {showMeta && hasMessage ? (
          <div className="flex flex-wrap gap-1 justify-end shrink-0">
            <Badge variant="secondary" className="text-[10px] font-medium tabular-nums">
              {meta.characters}
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-medium tabular-nums">
              {meta.segments} seg
            </Badge>
            <Badge variant="outline" className="text-[10px] font-medium">
              {meta.encoding}
            </Badge>
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          "relative overflow-hidden rounded-[1.75rem] bg-gradient-to-b from-muted/60 via-muted/35 to-muted/20 p-3 ring-1 ring-border/50",
          compact ? "p-2.5" : "sm:p-4",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-sky-500/10 blur-2xl"
        />

        <div className="relative mx-auto w-full max-w-[250px]">
          <div className="overflow-hidden rounded-[1.6rem] border border-border/70 bg-background shadow-[0_12px_40px_-18px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between px-3.5 pt-2.5 pb-1 text-[10px] font-semibold text-foreground/70">
              <span className="tabular-nums">9:41</span>
              <span className="mx-auto h-1.5 w-16 rounded-full bg-foreground/12" />
              <span className="flex items-center gap-0.5 text-foreground/55">
                <Signal className="h-2.5 w-2.5" />
                <Wifi className="h-2.5 w-2.5" />
                <Battery className="h-2.5 w-2.5" />
              </span>
            </div>

            <div className="border-b border-border/50 px-3.5 pb-2.5 pt-1">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Text message
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold tracking-tight">
                {senderLabel || "SplitSMS"}
              </p>
            </div>

            <div
              className={cn(
                "min-h-[120px] bg-[radial-gradient(circle_at_top,rgba(var(--muted)/0.55),transparent_55%)] px-3 py-4",
                compact && "min-h-[96px] py-3",
              )}
            >
              {hasMessage ? (
                <div className="flex justify-end">
                  <div className="max-w-[92%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-[13px] leading-relaxed text-primary-foreground shadow-sm whitespace-pre-wrap break-words">
                    {resolved}
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-[88px] flex-col items-center justify-center gap-2 text-center px-2">
                  <div className="h-10 w-[70%] rounded-2xl rounded-bl-md border border-dashed border-border/70 bg-muted/40" />
                  <p className="text-xs text-muted-foreground">
                    Start typing to preview your message
                  </p>
                </div>
              )}
            </div>

            {showMeta && hasMessage ? (
              <div className="flex items-center justify-between gap-2 border-t border-border/50 bg-muted/25 px-3.5 py-2 text-[10px] text-muted-foreground">
                <span className="tabular-nums">
                  {meta.characters} character{meta.characters === 1 ? "" : "s"}
                </span>
                <span className="tabular-nums">
                  {meta.segments} segment{meta.segments === 1 ? "" : "s"} · {meta.encoding}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {showVariableHints ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 px-3 py-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Sample values used</p>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATE_VARIABLES.map((v) => (
              <Badge key={v.key} variant="secondary" className="text-[10px] font-normal">
                {`{${v.key}}`} → {v.example}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
