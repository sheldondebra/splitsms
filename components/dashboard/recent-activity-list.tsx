import Link from "next/link";
import { Send, ArrowUpRight } from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";
import { STATUS_LABELS } from "@/lib/ux/messages";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  recipient: string;
  status: string;
  createdAt: Date;
  body: string;
};

export function RecentActivityList({ messages }: { messages: Message[] }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
        <h2 className="text-sm font-semibold">Recent messages</h2>
        <Link
          href="/dashboard/reports"
          className="text-xs font-medium text-primary inline-flex items-center gap-1 hover:underline"
        >
          All
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {messages.length === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={Send}
            title="No messages yet"
            description="Send your first SMS to see activity here."
            actionLabel="Send SMS"
            actionHref="/dashboard/send"
          />
        </div>
      ) : (
        <ul>
          {messages.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-4 px-5 py-3.5 border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
            >
              <div
                className={cn(
                  "h-2 w-2 rounded-full shrink-0",
                  m.status === "DELIVERED"
                    ? "bg-emerald-500"
                    : m.status === "FAILED"
                      ? "bg-destructive"
                      : "bg-muted-foreground/40",
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{m.recipient}</p>
                <p className="text-xs text-muted-foreground truncate">{m.body}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-medium text-muted-foreground">
                  {STATUS_LABELS[m.status] ?? m.status}
                </p>
                <p className="text-[10px] text-muted-foreground/80 mt-0.5 tabular-nums">
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
