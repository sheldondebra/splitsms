"use client";

import { useMemo } from "react";
import { getMessagePreview, estimateCampaignCost } from "@/lib/sms/message-preview";
import { personalizeMessage, SMS_PREVIEW_SAMPLE } from "@/lib/sms/personalize";
import { SmsPreview } from "@/components/sms/sms-preview";
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
  const resolved = useMemo(
    () => personalizeMessage(message, SMS_PREVIEW_SAMPLE),
    [message],
  );
  const preview = useMemo(() => getMessagePreview(resolved), [resolved]);
  const cost = useMemo(
    () => estimateCampaignCost(resolved, recipientCount, costPerUnit),
    [resolved, recipientCount, costPerUnit],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{preview.characters} chars</Badge>
        <Badge variant="outline">{preview.segments} segment(s)</Badge>
        <Badge variant="outline">{preview.encoding}</Badge>
        {preview.isUnicode && <Badge variant="destructive">Unicode</Badge>}
      </div>
      {recipientCount > 0 && (
        <p className="text-sm">
          <strong>{recipientCount}</strong> recipients ·{" "}
          <strong>{cost.totalUnits}</strong> total units · est.{" "}
          <strong>{cost.estimatedCost.toFixed(2)}</strong> credits cost
        </p>
      )}
      <SmsPreview message={message} showMeta={false} showVariableHints />
    </div>
  );
}
