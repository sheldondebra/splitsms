"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar } from "lucide-react";

export function formatAdminTopbarClock(date: Date) {
  return format(date, "EEE d MMM yyyy · hh:mm:ss a");
}

export function AdminTopbarClock() {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const label = formatAdminTopbarClock(now);

  return (
    <time
      dateTime={now.toISOString()}
      className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/20 px-2.5 py-1 text-xs font-medium tabular-nums tracking-tight text-muted-foreground whitespace-nowrap"
      suppressHydrationWarning
    >
      <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {label}
    </time>
  );
}
