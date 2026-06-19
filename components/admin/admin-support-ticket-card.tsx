import { format } from "date-fns";
import {
  adminReplySupportTicketAction,
  adminUpdateSupportTicketAction,
} from "@/lib/actions/admin-platform";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

export type AdminSupportTicket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  createdAt: Date;
  user: { id: string; fullName: string; phone: string; email?: string | null };
  replies: {
    id: string;
    body: string;
    isStaff: boolean;
    createdAt: Date;
    author: { fullName: string } | null;
  }[];
};

type AdminSupportTicketCardProps = {
  ticket: AdminSupportTicket;
  returnTo: string;
  compact?: boolean;
};

export function AdminSupportTicketCard({
  ticket: t,
  returnTo,
  compact,
}: AdminSupportTicketCardProps) {
  return (
    <div
      className={
        compact
          ? "rounded-lg border border-border/50 p-3 space-y-3"
          : "rounded-xl border border-border/60 p-4 space-y-4"
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className={compact ? "font-medium text-sm" : "font-semibold"}>{t.subject}</p>
            <Badge variant="outline" className="text-[10px]">
              {t.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{format(t.createdAt, "PPp")}</p>
        </div>
        {!compact && (
          <div className="shrink-0 text-right text-xs text-muted-foreground">
            <p className="font-medium text-foreground">{t.user.fullName}</p>
            <p>{t.user.phone}</p>
            {t.user.email && <p className="truncate max-w-[200px]">{t.user.email}</p>}
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-lg bg-muted/20 border border-border/40 p-3">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Member
          </p>
          <p className="text-sm whitespace-pre-wrap">{t.message}</p>
        </div>

        {t.replies.map((r) => (
          <div
            key={r.id}
            className={
              r.isStaff
                ? "border-l-2 border-primary pl-3 space-y-1"
                : "border-l-2 border-border pl-3 space-y-1"
            }
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {r.isStaff ? (r.author?.fullName ?? "SplitSMS support") : "Member"}
              <span className="font-normal normal-case ml-2">
                {format(r.createdAt, "PPp")}
              </span>
            </p>
            <p className="text-sm whitespace-pre-wrap">{r.body}</p>
          </div>
        ))}
      </div>

      <form action={adminReplySupportTicketAction} className="space-y-3 border-t border-border/50 pt-3">
        <input type="hidden" name="ticketId" value={t.id} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <div className="space-y-2">
          <Label htmlFor={`reply-${t.id}`} className="text-xs">
            Reply to member
          </Label>
          <Textarea
            id={`reply-${t.id}`}
            name="body"
            rows={compact ? 3 : 4}
            required
            placeholder="Type your reply — the member is notified by email and SMS."
            className="text-sm min-h-[80px]"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            name="status"
            defaultValue={t.status === "OPEN" ? "IN_PROGRESS" : t.status}
            className="flex h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm">
            Send reply
          </Button>
        </div>
      </form>

      <form
        action={adminUpdateSupportTicketAction}
        className="flex flex-wrap gap-2 items-center pt-1 border-t border-border/40"
      >
        <input type="hidden" name="ticketId" value={t.id} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <select
          name="status"
          defaultValue={t.status}
          className="flex h-8 rounded-md border border-input bg-background px-2 text-xs"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" variant="secondary">
          Update status only
        </Button>
      </form>
    </div>
  );
}
