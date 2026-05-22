"use client";

import { useMemo } from "react";
import { getMessagePreview, estimateCampaignCost } from "@/lib/sms/message-preview";
import { PERSONALIZATION_HINT } from "@/lib/sms/personalize";
import { Badge } from "@/components/ui/badge";

export function CampaignMessagePreview({
  message,
  recipientCount,
  costPerUnit = 0.05,
}: {
  message: string;
  recipientCount: number;
  costPerUnit?: number;
}) {
  const preview = useMemo(() => getMessagePreview(message), [message]);
  const cost = useMemo(
    () => estimateCampaignCost(message, recipientCount, costPerUnit),
    [message, recipientCount, costPerUnit],
  );

  return (
    <div className="rounded-lg border bg-muted/20 p-4 space-y-3 text-sm">
      <p className="text-muted-foreground">{PERSONALIZATION_HINT}</p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{preview.characters} chars</Badge>
        <Badge variant="outline">{preview.segments} segment(s)</Badge>
        <Badge variant="outline">{preview.encoding}</Badge>
        {preview.isUnicode && <Badge variant="destructive">Unicode</Badge>}
      </div>
      {recipientCount > 0 && (
        <p>
          <strong>{recipientCount}</strong> recipients ·{" "}
          <strong>{cost.totalUnits}</strong> total units · est.{" "}
          <strong>{cost.estimatedCost.toFixed(2)}</strong> credits cost
        </p>
      )}
      {message && (
        <div className="rounded border bg-background p-3 text-sm whitespace-pre-wrap">
          {message.replace(/\{name\}/gi, "Alex").replace(/\{phone\}/gi, "+233201234567")}
        </div>
      )}
    </div>
  );
}
