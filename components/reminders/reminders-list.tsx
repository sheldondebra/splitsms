import Link from "next/link";
import {
  pauseReminderAction,
  resumeReminderAction,
  cancelReminderAction,
} from "@/lib/actions/reminders";
import { reminderTitleFromCampaignName } from "@/lib/reminders/types";
import { EmptyState } from "@/components/dashboard/empty-state";
import { AppCard, AppCardBody } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import {
  Bell,
  CalendarDays,
  Gift,
  PartyPopper,
  Pause,
  Play,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";

export type ReminderRow = {
  id: string;
  name: string;
  message: string;
  status: string;
  recipientCount: number;
  scheduledAt: string | null;
  recurrence: string;
  contactGroupName: string | null;
};

const USE_CASES = [
  {
    icon: Wallet,
    title: "Payments",
    description: "Early + due-date SMS every month for fees or gold payments.",
  },
  {
    icon: PartyPopper,
    title: "Birthdays",
    description: "Wish contacts on a chosen date with a personal message.",
  },
  {
    icon: CalendarDays,
    title: "Meetings",
    description: "Remind people the day before and on the day of a meeting.",
  },
  {
    icon: Gift,
    title: "Holidays",
    description: "Send seasonal greetings to a group or all contacts.",
  },
] as const;

function statusLabel(status: string) {
  if (status === "SCHEDULED") return "Scheduled";
  if (status === "PAUSED") return "Paused";
  if (status === "SENDING") return "Sending";
  if (status === "COMPLETED") return "Sent";
  if (status === "CANCELLED") return "Cancelled";
  return status;
}

function statusTone(status: string) {
  if (status === "SCHEDULED") return "default" as const;
  if (status === "PAUSED") return "secondary" as const;
  if (status === "COMPLETED") return "outline" as const;
  if (status === "CANCELLED") return "outline" as const;
  return "outline" as const;
}

export function RemindersList({ rows }: { rows: ReminderRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={Bell}
          title="No reminders yet"
          description="Schedule SMS for payments, birthdays, meetings, or holidays — including early reminders before a due date."
          actionLabel="Create reminder"
          actionHref="/dashboard/reminders/new"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          {USE_CASES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const upcoming = rows.filter((r) => r.status === "SCHEDULED" || r.status === "PAUSED").length;
  const monthly = rows.filter((r) => r.recurrence === "MONTHLY").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <AppCard>
          <AppCardBody className="p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Total
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{rows.length}</p>
          </AppCardBody>
        </AppCard>
        <AppCard>
          <AppCardBody className="p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Upcoming
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{upcoming}</p>
          </AppCardBody>
        </AppCard>
        <AppCard>
          <AppCardBody className="p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Monthly
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{monthly}</p>
          </AppCardBody>
        </AppCard>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Your reminders</h2>
        <Link
          href="/dashboard/reminders/new"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </Link>
      </div>

      <ul className="space-y-3">
        {rows.map((row) => {
          const title = reminderTitleFromCampaignName(row.name);
          const kind = /·\s*Early/i.test(row.name)
            ? "Early"
            : /·\s*Due/i.test(row.name)
              ? "Due"
              : null;
          const when = row.scheduledAt ? new Date(row.scheduledAt) : null;

          return (
            <li key={row.id}>
              <AppCard>
                <AppCardBody className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Bell className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="truncate text-sm font-semibold">{title}</p>
                          {kind ? (
                            <Badge variant="secondary" className="text-[10px] font-normal">
                              {kind}
                            </Badge>
                          ) : null}
                          <Badge
                            variant={statusTone(row.status)}
                            className="text-[10px] font-normal"
                          >
                            {statusLabel(row.status)}
                          </Badge>
                          {row.recurrence === "MONTHLY" ? (
                            <Badge variant="outline" className="text-[10px] font-normal">
                              Monthly
                            </Badge>
                          ) : null}
                        </div>
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {row.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {when
                            ? `${format(when, "MMM d, yyyy · h:mm a")} · ${formatDistanceToNow(when, { addSuffix: true })}`
                            : "No schedule"}
                          {" · "}
                          {row.recipientCount.toLocaleString()} recipient
                          {row.recipientCount === 1 ? "" : "s"}
                          {row.contactGroupName ? ` · ${row.contactGroupName}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2 sm:pt-0.5">
                      {row.status === "SCHEDULED" ? (
                        <form action={pauseReminderAction}>
                          <input type="hidden" name="id" value={row.id} />
                          <Button type="submit" size="sm" variant="outline" className="gap-1.5">
                            <Pause className="h-3.5 w-3.5" />
                            Pause
                          </Button>
                        </form>
                      ) : null}
                      {row.status === "PAUSED" ? (
                        <form action={resumeReminderAction}>
                          <input type="hidden" name="id" value={row.id} />
                          <Button type="submit" size="sm" variant="outline" className="gap-1.5">
                            <Play className="h-3.5 w-3.5" />
                            Resume
                          </Button>
                        </form>
                      ) : null}
                      {row.status === "SCHEDULED" || row.status === "PAUSED" ? (
                        <form action={cancelReminderAction}>
                          <input type="hidden" name="id" value={row.id} />
                          <Button
                            type="submit"
                            size="sm"
                            variant="ghost"
                            className="gap-1.5 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Cancel
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </AppCardBody>
              </AppCard>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
