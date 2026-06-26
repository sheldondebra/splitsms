"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { createSupportTicketAction } from "@/lib/actions/support";
import {
  SupportChatPanel,
  type ChatMessage,
} from "@/components/dashboard/support-chat-panel";
import { SupportStats } from "@/components/dashboard/support-stats";
import { FriendlyAlert } from "@/components/dashboard/friendly-alert";
import { AppCard, AppCardBody } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  QUICK_TOPICS,
  HELP_LINKS,
  getTicketStatusMeta,
} from "@/lib/support/meta";
import type { SupportPresence } from "@/lib/support/presence-meta";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  LifeBuoy,
  Plus,
} from "lucide-react";

export type SupportTicketRow = {
  id: string;
  ticketNumber: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  replies: {
    id: string;
    body: string;
    isStaff: boolean;
    createdAt: string;
    authorName: string | null;
  }[];
};

export type SupportDashboardProps = {
  firstName: string;
  email: string | null;
  chatMessages: ChatMessage[];
  tickets: SupportTicketRow[];
  supportPresence?: SupportPresence;
  sent: boolean;
  error?: string;
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function latestPreview(ticket: SupportTicketRow) {
  const lastReply = ticket.replies[ticket.replies.length - 1];
  return lastReply?.body ?? ticket.message;
}

function TicketStatusBadge({ status }: { status: string }) {
  const meta = getTicketStatusMeta(status);
  const StatusIcon = meta.icon;

  return (
    <Badge variant="outline" className={cn("h-6 gap-1 px-2 text-[11px] font-medium", meta.className)}>
      <StatusIcon className="h-3 w-3" />
      {meta.label}
    </Badge>
  );
}

function TicketThread({ ticket }: { ticket: SupportTicketRow }) {
  return (
    <div className="space-y-2 border-t border-border/40 bg-muted/10 px-4 py-3">
      <div className="rounded-lg bg-background px-3 py-2 ring-1 ring-border/50">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          You · {formatWhen(ticket.createdAt)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{ticket.message}</p>
      </div>
      {ticket.replies.map((r) => (
        <div
          key={r.id}
          className={cn(
            "rounded-lg px-3 py-2 ring-1",
            r.isStaff
              ? "bg-primary/5 ring-primary/15"
              : "bg-background ring-border/50",
          )}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {r.isStaff ? (r.authorName ?? "SplitSMS support") : "You"} · {formatWhen(r.createdAt)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{r.body}</p>
        </div>
      ))}
    </div>
  );
}

function TicketList({
  tickets,
  expandedId,
  onToggle,
}: {
  tickets: SupportTicketRow[];
  expandedId: string | null;
  onToggle: (id: string) => void;
}) {
  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
        <LifeBuoy className="h-8 w-8 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-foreground">No tickets yet</p>
        <p className="mt-1 text-xs text-muted-foreground max-w-[220px]">
          Send a quick message in the chat or open a detailed ticket.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Subject</TableHead>
              <TableHead className="w-[88px]">Ticket</TableHead>
              <TableHead className="w-[104px]">Status</TableHead>
              <TableHead className="w-[84px]">Date</TableHead>
              <TableHead className="w-10 pr-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => {
              const expanded = expandedId === ticket.id;
              return (
                <Fragment key={ticket.id}>
                  <TableRow className="group">
                    <TableCell className="pl-4 py-3 align-top">
                      <button
                        type="button"
                        onClick={() => onToggle(ticket.id)}
                        className="w-full text-left"
                      >
                        <p className="truncate text-sm font-semibold text-foreground max-w-[280px]">
                          {ticket.subject}
                        </p>
                        {!expanded && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground max-w-[320px]">
                            {latestPreview(ticket)}
                          </p>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="align-top py-3">
                      {ticket.ticketNumber ? (
                        <span className="font-mono text-[11px] font-semibold text-primary">
                          {ticket.ticketNumber}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="align-top py-3">
                      <TicketStatusBadge status={ticket.status} />
                    </TableCell>
                    <TableCell className="align-top py-3 text-xs text-muted-foreground tabular-nums">
                      {formatDate(ticket.createdAt)}
                    </TableCell>
                    <TableCell className="align-top py-3 pr-4">
                      <button
                        type="button"
                        onClick={() => onToggle(ticket.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60"
                        aria-label={expanded ? "Collapse thread" : "Expand thread"}
                      >
                        {expanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </TableCell>
                  </TableRow>
                  {expanded && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={5} className="p-0">
                        <TicketThread ticket={ticket} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden divide-y divide-border/50">
        {tickets.map((ticket) => {
          const expanded = expandedId === ticket.id;
          return (
            <div key={ticket.id}>
              <button
                type="button"
                onClick={() => onToggle(ticket.id)}
                className="flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-muted/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">{ticket.subject}</p>
                    <TicketStatusBadge status={ticket.status} />
                  </div>
                  {ticket.ticketNumber ? (
                    <p className="mt-0.5 font-mono text-[10px] font-semibold text-primary">
                      {ticket.ticketNumber}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[11px] text-muted-foreground">{formatWhen(ticket.createdAt)}</p>
                  {!expanded && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {latestPreview(ticket)}
                    </p>
                  )}
                </div>
                {expanded ? (
                  <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>
              {expanded && <TicketThread ticket={ticket} />}
            </div>
          );
        })}
      </div>
    </>
  );
}

export function SupportDashboard({
  firstName,
  email,
  chatMessages,
  tickets,
  supportPresence,
  sent,
  error,
}: SupportDashboardProps) {
  const [draftKey, setDraftKey] = useState(0);
  const [draftMessage, setDraftMessage] = useState("");
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const openCount = tickets.filter((t) => t.status.toUpperCase() === "OPEN").length;

  function applyTopic(draft: string) {
    setDraftMessage(draft);
    setDraftKey((k) => k + 1);
    setShowTicketForm(false);
  }

  function toggleExpanded(id: string) {
    setExpandedId((current) => (current === id ? null : id));
  }

  return (
    <div className="space-y-4">
      {sent && (
        <FriendlyAlert
          success="1"
          successMessage="Message sent — our team will follow up by email or SMS."
        />
      )}
      {error === "empty" && <FriendlyAlert error="support_empty" />}
      {error === "invalid" && <FriendlyAlert error="support_invalid" />}

      <SupportStats
        openCount={openCount}
        totalCount={tickets.length}
        contactLabel={email ? "Email" : "SMS"}
      />

      <AppCard className="overflow-hidden">
        <AppCardBody className="p-0">
          <div className="grid xl:grid-cols-5 xl:items-start">
            <div className="flex min-h-0 flex-col xl:col-span-3">
              <SupportChatPanel
                key={draftKey}
                embedded
                className="h-[min(480px,58vh)] max-h-[520px] xl:max-h-none xl:min-h-[520px]"
                initialMessages={chatMessages}
                draftMessage={draftMessage}
                initialPresence={supportPresence}
              />

              <div className="border-t border-border/50 bg-muted/15 px-4 py-3 sm:px-5">
                <p className="text-[11px] font-medium text-muted-foreground mb-2">Quick topics</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_TOPICS.map((topic) => (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => applyTopic(topic.draft)}
                      className="rounded-full bg-background px-3 py-1.5 text-xs font-medium text-foreground ring-1 ring-border/60 transition-colors hover:bg-primary/5 hover:ring-primary/30"
                    >
                      {topic.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col border-t border-border/50 xl:col-span-2 xl:border-l xl:border-t-0">
              <div className="flex items-center justify-between gap-3 border-b border-border/50 bg-muted/10 px-4 py-3 sm:px-5">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Your tickets</h2>
                  <p className="text-xs text-muted-foreground">
                    {tickets.length} conversation{tickets.length === 1 ? "" : "s"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant={showTicketForm ? "secondary" : "outline"}
                  size="sm"
                  className="h-9 gap-1.5 shrink-0"
                  onClick={() => setShowTicketForm((v) => !v)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {showTicketForm ? "Close" : "New ticket"}
                </Button>
              </div>

              {showTicketForm && (
                <form
                  action={createSupportTicketAction}
                  className="space-y-3 border-b border-border/50 bg-muted/5 px-4 py-4 sm:px-5"
                >
                  <p className="text-xs text-muted-foreground">
                    Hi {firstName} — for billing disputes or delivery investigations, add a subject
                    and full details below.
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="ticket-subject" className="text-xs">
                      Subject
                    </Label>
                    <Input
                      id="ticket-subject"
                      name="subject"
                      required
                      maxLength={120}
                      placeholder="Brief summary"
                      className="h-10 bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ticket-message" className="text-xs">
                      Message
                    </Label>
                    <Textarea
                      id="ticket-message"
                      name="message"
                      rows={3}
                      required
                      placeholder="What happened and what you need…"
                      className="min-h-[88px] bg-background text-sm"
                    />
                  </div>
                  <Button type="submit" className="h-10 w-full">
                    Submit ticket
                  </Button>
                </form>
              )}

              <TicketList
                tickets={tickets}
                expandedId={expandedId}
                onToggle={toggleExpanded}
              />

              <div className="border-t border-border/50 bg-muted/10 px-4 py-3 sm:px-5">
                <p className="text-[11px] font-medium text-muted-foreground mb-2">Helpful links</p>
                <div className="grid grid-cols-2 gap-2">
                  {HELP_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="inline-flex items-center justify-between rounded-lg bg-background px-2.5 py-2 text-xs font-medium text-foreground ring-1 ring-border/50 hover:bg-muted/40"
                    >
                      <span className="truncate">{link.label}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground ml-1" />
                    </Link>
                  ))}
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                  We reply by email{email ? ` (${email})` : ""} and SMS. Include message IDs when
                  reporting delivery issues.
                </p>
              </div>
            </div>
          </div>
        </AppCardBody>
      </AppCard>
    </div>
  );
}
