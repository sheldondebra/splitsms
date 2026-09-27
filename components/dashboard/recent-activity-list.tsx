import Link from "next/link";
import { MessageSquare, Send, ArrowUpRight } from "lucide-react";
import { STATUS_LABELS } from "@/lib/ux/messages";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  recipient: string;
  status: string;
  createdAt: Date;
  body: string;
};

function statusDotClass(status: string) {
  if (status === "SENT" || status === "DELIVERED") return "bg-emerald-500";
  if (status === "FAILED" || status === "REJECTED" || status === "EXPIRED") {
    return "bg-destructive";
  }
  if (status === "PENDING") return "bg-amber-400";
  return "bg-muted-foreground/40";
}

function statusBadgeClass(status: string) {
  if (status === "SENT" || status === "DELIVERED") {
    return "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  }
  if (status === "FAILED" || status === "REJECTED" || status === "EXPIRED") {
    return "border-red-500/40 bg-red-500/15 text-red-700 dark:text-red-300";
  }
  if (status === "PENDING") {
    return "border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300";
  }
  return "border-border bg-muted text-muted-foreground";
}

export function RecentActivityList({ messages }: { messages: Message[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3.5 sm:px-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
            <MessageSquare className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Recent messages</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Latest sends and their delivery status.</p>
          </div>
        </div>
        <Link
          href="/dashboard/reports"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          All results
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border/60">
            <Send className="h-4 w-4" />
          </span>
          <p className="text-sm font-semibold">No messages yet</p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            Send your first SMS to see activity here.
          </p>
          <Link
            href="/dashboard/send"
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Send className="h-3.5 w-3.5" />
            Send SMS
          </Link>
        </div>
      ) : (
        <ul>
          {messages.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 border-b border-border/40 px-4 py-3.5 transition-colors last:border-0 hover:bg-muted/25 sm:gap-4 sm:px-5"
            >
              <div className={cn("h-2 w-2 shrink-0 rounded-full", statusDotClass(m.status))} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.recipient}</p>
                <p className="truncate text-xs text-muted-foreground">{m.body}</p>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={cn(
                    "inline-flex items-center rounded-md border px-1.5 py-px text-[10px] font-semibold leading-4",
                    statusBadgeClass(m.status),
                  )}
                >
                  {STATUS_LABELS[m.status] ?? m.status}
                </p>
                <p className="mt-0.5 text-[10px] tabular-nums text-muted-foreground/80">
                  {m.createdAt.toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
