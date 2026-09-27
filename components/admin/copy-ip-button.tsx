"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

export function CopyIpButton({ ip }: { ip: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(ip).then(
          () => toast.success("Copied", { description: ip }),
          () => toast.error("Could not copy"),
        );
      }}
      className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      aria-label={`Copy ${ip}`}
    >
      <Copy className="h-3 w-3" />
    </button>
  );
}
