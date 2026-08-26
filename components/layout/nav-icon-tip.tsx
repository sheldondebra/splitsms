"use client";

import { useCallback, useState } from "react";
import { createPortal } from "react-dom";

type Tip = { label: string; top: number; left: number };

export function useNavIconTip(enabled: boolean) {
  const [tip, setTip] = useState<Tip | null>(null);

  const show = useCallback(
    (event: { currentTarget: EventTarget & Element }, label: string) => {
      if (!enabled) return;
      const rect = event.currentTarget.getBoundingClientRect();
      setTip({
        label,
        top: rect.top + rect.height / 2,
        left: rect.right + 10,
      });
    },
    [enabled],
  );

  const hide = useCallback(() => setTip(null), []);

  const node =
    enabled && tip && typeof document !== "undefined"
      ? createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[90] -translate-y-1/2 rounded-md border border-border/70 bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow-md"
            style={{ top: tip.top, left: tip.left }}
          >
            {tip.label}
          </div>,
          document.body,
        )
      : null;

  return { show, hide, node };
}
