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
import { MessageSquare } from "lucide-react";

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
  title = "SMS preview",
}: SmsPreviewProps) {
  const resolved = useMemo(
    () => personalizeMessage(message, { ...SMS_PREVIEW_SAMPLE, ...sampleVars }),
    [message, sampleVars],
  );
  const meta = useMemo(() => getMessagePreview(resolved), [resolved]);
  const hasMessage = resolved.trim().length > 0;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary shrink-0" />
          {title}
        </p>
        {showMeta && hasMessage ? (
          <div className="flex flex-wrap gap-1 justify-end">
            <Badge variant="outline" className="text-[10px]">
              {meta.characters} chars
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {meta.segments} seg
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {meta.encoding}
            </Badge>
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          "rounded-2xl border border-border/60 bg-muted/30 p-4",
          compact ? "p-3" : "p-4 sm:p-5",
        )}
      >
        <div className="mx-auto max-w-[280px]">
          <div className="rounded-[1.25rem] border border-border/80 bg-background shadow-sm overflow-hidden">
            <div className="bg-muted/50 px-3 py-2 border-b border-border/60 flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Messages
              </span>
              <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                {senderLabel}
              </span>
            </div>
            <div className={cn("p-3 sm:p-4 min-h-[88px]", compact && "min-h-[72px]")}>
              {hasMessage ? (
                <div className="rounded-2xl rounded-tl-md bg-primary text-primary-foreground px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm">
                  {resolved}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  Type a message to see preview…
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showVariableHints ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/15 px-3 py-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Sample values used</p>
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
