"use client";

import { useMemo, useState } from "react";

function countUnits(text: string) {
  const gsm = /^[\x00-\x7F@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-./0-9:;<=>?¡A-ZÄÖÑÜ§¿a-zäöñüà]*$/.test(
    text,
  );
  const len = text.length;
  if (gsm) return len <= 160 ? 1 : Math.ceil(len / 153);
  return len <= 70 ? 1 : Math.ceil(len / 67);
}

export function SendCostPreview({
  unitPrice = 0.029,
}: {
  unitPrice?: number;
}) {
  const [body, setBody] = useState("");
  const [count, setCount] = useState(1);

  const estimate = useMemo(() => {
    const units = countUnits(body);
    const totalUnits = units * Math.max(1, count);
    return {
      units,
      totalUnits,
      cost: (totalUnits * unitPrice).toFixed(4),
    };
  }, [body, count, unitPrice]);

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3 text-sm">
      <p className="font-medium text-primary">Cost preview</p>
      <div className="grid grid-cols-2 gap-2 text-muted-foreground">
        <span>SMS pages / msg</span>
        <span className="text-foreground font-medium">{estimate.units}</span>
        <span>Recipients</span>
        <input
          type="number"
          min={1}
          value={count}
          onChange={(e) => setCount(Number(e.target.value) || 1)}
          className="h-8 rounded border bg-background px-2 text-foreground"
        />
        <span>Total credits</span>
        <span className="text-foreground font-medium">{estimate.totalUnits}</span>
        <span>Est. cost (GHS)</span>
        <span className="text-foreground font-bold">{estimate.cost}</span>
      </div>
      <textarea
        className="w-full h-16 rounded border bg-background p-2 text-xs"
        placeholder="Type message to preview units…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <p className="text-xs text-muted-foreground">
        Credits deducted before send. Failed messages auto-refunded.
      </p>
    </div>
  );
}
