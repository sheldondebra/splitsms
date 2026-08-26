"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Circle, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminSendOneMemberAccountReportAction } from "@/lib/actions/admin-reports";
import type { ReportPeriodDays } from "@/lib/reports/period";
import { formatReportCount } from "@/lib/reports/format";
import { cn } from "@/lib/utils";

export type AccountReportRecipient = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
};

type RowStatus = "idle" | "sending" | "sent" | "failed";

type RowState = AccountReportRecipient & {
  status: RowStatus;
  detail?: string;
};

function StatusIcon({ status }: { status: RowStatus }) {
  if (status === "sending") return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
  if (status === "sent") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (status === "failed") return <AlertCircle className="h-4 w-4 text-destructive" />;
  return <Circle className="h-4 w-4 text-muted-foreground/50" />;
}

export function SendAllMemberReportsButton({
  period,
  eligible,
  noEmail,
  inactive,
  recipients,
}: {
  period: ReportPeriodDays;
  eligible: number;
  noEmail: number;
  inactive: number;
  recipients: AccountReportRecipient[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [rows, setRows] = useState<RowState[]>(() =>
    recipients.map((r) => ({ ...r, status: "idle" })),
  );
  const currentRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "nearest" });
  }, [rows]);

  const sent = rows.filter((r) => r.status === "sent").length;
  const failed = rows.filter((r) => r.status === "failed").length;
  const processed = sent + failed;
  const current = rows.find((r) => r.status === "sending");

  async function sendAll() {
    setRunning(true);
    setDone(false);
    let nextSent = 0;
    let nextFailed = 0;
    const failureNotes: string[] = [];

    try {
      for (const recipient of recipients) {
        setRows((prev) =>
          prev.map((row) =>
            row.id === recipient.id ? { ...row, status: "sending", detail: "Sending…" } : row,
          ),
        );

        const result = await adminSendOneMemberAccountReportAction({
          userId: recipient.id,
          days: period,
        });

        if (result.status === "sent") {
          nextSent += 1;
          setRows((prev) =>
            prev.map((row) =>
              row.id === recipient.id
                ? { ...row, status: "sent", detail: result.email ? `Sent to ${result.email}` : "Sent" }
                : row,
            ),
          );
        } else {
          nextFailed += 1;
          const error = result.error || "Send failed";
          failureNotes.push(`${result.member || recipient.fullName}: ${error}`);
          setRows((prev) =>
            prev.map((row) =>
              row.id === recipient.id ? { ...row, status: "failed", detail: error } : row,
            ),
          );
        }
      }

      if (nextSent === 0 && nextFailed === 0) {
        toast.message("No reports sent", {
          description: "No active members with an email were found for this period.",
        });
      } else if (nextFailed === 0) {
        toast.success(`Emailed ${formatReportCount(nextSent)} account reports`, {
          description: `Last ${period} days. Members also got an in-app notice.`,
        });
      } else {
        toast.error(
          `Sent ${formatReportCount(nextSent)}, ${formatReportCount(nextFailed)} failed`,
          { description: failureNotes.slice(0, 3).join(" ") },
        );
      }
    } catch (error) {
      toast.error("Send to all stopped", {
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    } finally {
      setRunning(false);
      setDone(true);
      router.refresh();
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="gap-1.5"
        disabled={eligible === 0 || running}
        onClick={() => {
          setDone(false);
          setRows(recipients.map((r) => ({ ...r, status: "idle" })));
          setOpen(true);
        }}
      >
        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        {running
          ? `Sending ${processed}/${eligible}`
          : `Email all ${formatReportCount(eligible)} members`}
      </Button>

      <Dialog open={open} onOpenChange={(next) => !running && setOpen(next)}>
        <DialogContent className="sm:max-w-lg" showCloseButton={!running}>
          <DialogHeader>
            <DialogTitle>
              {running
                ? `Sending to ${current?.fullName ?? "members"}…`
                : done
                  ? "Reports finished"
                  : `Email reports to ${formatReportCount(eligible)} members?`}
            </DialogTitle>
            <DialogDescription>
              {running
                ? `Last ${period} days — one PDF per member. Watch each send below.`
                : done
                  ? `${formatReportCount(sent)} sent, ${formatReportCount(failed)} failed.`
                  : `This emails a last-${period}-day PDF statement to every active member with an email. Confirm the list, then we send one after another.`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              Recipients: <span className="font-semibold tabular-nums text-foreground">{formatReportCount(eligible)}</span>
            </span>
            {noEmail > 0 ? <span>Skip, no email: {formatReportCount(noEmail)}</span> : null}
            {inactive > 0 ? (
              <span>Skip, suspended or blocked: {formatReportCount(inactive)}</span>
            ) : null}
            {running || done ? (
              <>
                <span className="text-emerald-700 dark:text-emerald-300">
                  Sent {formatReportCount(sent)}
                </span>
                <span className={failed > 0 ? "text-destructive" : undefined}>
                  Failed {formatReportCount(failed)}
                </span>
              </>
            ) : null}
          </div>

          <ul className="max-h-80 space-y-0.5 overflow-y-auto rounded-lg border border-border/60 bg-muted/20 p-1.5">
            {rows.length === 0 ? (
              <li className="px-2 py-6 text-center text-sm text-muted-foreground">
                No eligible members.
              </li>
            ) : (
              rows.map((row) => (
                <li
                  key={row.id}
                  ref={row.status === "sending" ? currentRef : undefined}
                  className={cn(
                    "flex items-start gap-2.5 rounded-md px-2 py-1.5",
                    row.status === "sending" && "bg-primary/10",
                  )}
                >
                  <StatusIcon status={row.status} />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-sm font-medium",
                        row.status === "sent" && "text-emerald-700 dark:text-emerald-300",
                        row.status === "failed" && "text-destructive",
                      )}
                    >
                      {row.fullName}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {row.detail ?? [row.email, row.phone].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={running}
              onClick={() => setOpen(false)}
            >
              {done ? "Close" : "Cancel"}
            </Button>
            {!done ? (
              <Button type="button" disabled={running || eligible === 0} onClick={() => void sendAll()}>
                {running ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {current ? `Sending ${current.fullName}` : `Sending ${processed}/${eligible}`}
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Send {formatReportCount(eligible)} reports
                  </>
                )}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
