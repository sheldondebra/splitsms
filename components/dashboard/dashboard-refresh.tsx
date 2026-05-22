"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Manual + optional auto refresh for live dashboard feel */
export function DashboardRefresh({ autoMs = 60000 }: { autoMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    if (!autoMs || autoMs <= 0) return;
    const id = setInterval(() => router.refresh(), autoMs);
    return () => clearInterval(id);
  }, [router, autoMs]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={() => router.refresh()}
      aria-label="Refresh dashboard"
    >
      <RefreshCw className="h-4 w-4" />
    </Button>
  );
}
