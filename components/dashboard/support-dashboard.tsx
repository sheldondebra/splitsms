"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupportTicketAction } from "@/lib/actions/support";
import {
  SupportChatPanel,
  type ChatMessage,
} from "@/components/dashboard/support-chat-panel";
import { FriendlyAlert } from "@/components/dashboard/friendly-alert";
import {
  AppCard,
  AppCardBody,
  AppCardTitle,
  MobileCardList,
  MobileCardItem,
} from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  QUICK_TOPICS,
  HELP_LINKS,
  getTicketStatusMeta,
} from "@/lib/support/meta";
import {
  LifeBuoy,
  MessageSquare,
  Clock,
  Mail,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Ticket,
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

function TicketThread({ ticket }: { ticket: SupportTicketRow }) {
  return (
    <div className="mt-3 space-y-3 border-t border-border/50 pt-3">
      <div className="rounded-lg bg-muted/30 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
          You
        </p>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.message}</p>
      </div>
      {ticket.replies.map((r) => (
        <div
          key={r.id}
          className={
            r.isStaff
              ? "rounded-lg border border-primary/20 bg-primary/5 px-3 py-2"
              : "rounded-lg bg-muted/30 px-3 py-2"
          }
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            {r.isStaff ? (r.authorName ?? "SplitSMS support") : "You"}
            <span className="font-normal normal-case ml-2">{formatWhen(r.createdAt)}</span>
          </p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.body}</p>
        </div>
      ))}
    </div>
  );
}

export type SupportDashboardProps = {
  firstName: string;
  email: string | null;
  chatMessages: ChatMessage[];
  tickets: SupportTicketRow[];
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

export function SupportDashboard({
  firstName,
  email,
  chatMessages,
  tickets,
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

  return (
    <div className="space-y-6 lg:space-y-8">
      {sent && (
        <FriendlyAlert
          success="1"
          successMessage="Message sent — our team will follow up by email or SMS."
        />
      )}
      {error === "empty" && <FriendlyAlert error="support_empty" />}
      {error === "invalid" && <FriendlyAlert error="support_invalid" />}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Open tickets", value: openCount.toString(), icon: Clock },
          { label: "Total requests", value: tickets.length.toString(), icon: Ticket },
          { label: "Response time", value: "1–2 days", icon: MessageSquare },
          {
            label: "Contact",
            value: email ? "Email" : "SMS",
            icon: Mail,
            className: "col-span-2 sm:col-span-1",
          },
        ].map(({ label, value, icon: Icon, className }) => (
          <div
            key={label}
            className={cn(
              "rounded-2xl border border-border/60 bg-card px-4 py-4 shadow-sm",
              className,
            )}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
            </div>
            <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-5 xl:gap-8">
        <div className="space-y-5 xl:col-span-3">
          <AppCard className="overflow-hidden">
            <AppCardBody className="p-0 sm:p-0">
              <SupportChatPanel
                key={draftKey}
                initialMessages={chatMessages}
                draftMessage={draftMessage}
              />
            </AppCardBody>
          </AppCard>

          <div className="flex flex-wrap gap-2">
            {QUICK_TOPICS.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => applyTopic(topic.draft)}
                className="rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                {topic.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5 xl:col-span-2">
          <AppCard>
            <AppCardBody className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <AppCardTitle
                  title="Detailed ticket"
                  description="Subject + message for complex issues"
                  icon={Ticket}
                  className="mb-0"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 shrink-0"
                  onClick={() => setShowTicketForm((v) => !v)}
                >
                  {showTicketForm ? "Hide" : "New ticket"}
                </Button>
              </div>

              {showTicketForm ? (
                <form
                  action={createSupportTicketAction}
                  className="space-y-4 border-t border-border/50 pt-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="ticket-subject">Subject</Label>
                    <Input
                      id="ticket-subject"
                      name="subject"
                      required
                      maxLength={120}
                      placeholder="Brief summary of your issue"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ticket-message">Message</Label>
                    <Textarea
                      id="ticket-message"
                      name="message"
                      rows={4}
                      required
                      placeholder="Describe what happened and what you need…"
                      className="min-h-[100px] text-base"
                    />
                  </div>
                  <Button type="submit" className="h-11 w-full">
                    Submit ticket
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Hi {firstName} — use the chat for quick questions, or open a detailed ticket for
                  billing disputes, delivery investigations, or account issues.
                </p>
              )}
            </AppCardBody>
          </AppCard>

          <AppCard>
            <AppCardBody className="space-y-4">
              <AppCardTitle
                title="Your requests"
                description={
                  tickets.length === 0
                    ? "No tickets yet"
                    : `${tickets.length} conversation${tickets.length === 1 ? "" : "s"}`
                }
                icon={MessageSquare}
                className="mb-0"
              />

              {tickets.length === 0 ? (
                <p className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
                  Send a message in the chat to start a support conversation.
                </p>
              ) : (
                <>
                  <MobileCardList>
                    {tickets.slice(0, 8).map((t) => {
                      const meta = getTicketStatusMeta(t.status);
                      const StatusIcon = meta.icon;
                      const expanded = expandedId === t.id;
                      return (
                        <MobileCardItem key={t.id}>
                          <button
                            type="button"
                            onClick={() => setExpandedId(expanded ? null : t.id)}
                            className="flex w-full items-start justify-between gap-3 text-left"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-foreground">{t.subject}</p>
                              <p className="mt-0.5 font-mono text-[10px] text-primary">
                                {t.ticketNumber}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatWhen(t.createdAt)}
                              </p>
                              {!expanded && (
                                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                  {t.message}
                                </p>
                              )}
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-2">
                              <Badge
                                variant="outline"
                                className={cn("gap-1 text-[10px]", meta.className)}
                              >
                                <StatusIcon className="h-3 w-3" />
                                {meta.label}
                              </Badge>
                              {expanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </button>
                          {expanded && <TicketThread ticket={t} />}
                        </MobileCardItem>
                      );
                    })}
                  </MobileCardList>

                  <ul className="hidden space-y-2 md:block">
                    {tickets.slice(0, 10).map((t) => {
                      const meta = getTicketStatusMeta(t.status);
                      const StatusIcon = meta.icon;
                      const expanded = expandedId === t.id;
                      return (
                        <li
                          key={t.id}
                          className="rounded-xl border border-border/60 bg-card p-4"
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedId(expanded ? null : t.id)}
                            className="flex w-full items-start justify-between gap-3 text-left"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-foreground">{t.subject}</p>
                              <p className="mt-0.5 font-mono text-[10px] text-primary">
                                {t.ticketNumber}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatWhen(t.createdAt)}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn("shrink-0 gap-1", meta.className)}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {meta.label}
                            </Badge>
                          </button>
                          {expanded ? (
                            <TicketThread ticket={t} />
                          ) : (
                            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                              {t.replies.length > 0
                                ? t.replies[t.replies.length - 1]!.body
                                : t.message}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </AppCardBody>
          </AppCard>

          <AppCard>
            <AppCardBody className="space-y-3">
              <AppCardTitle title="Helpful links" icon={LifeBuoy} className="mb-0" />
              <ul className="space-y-1">
                {HELP_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex items-center justify-between rounded-lg px-2 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50"
                    >
                      {link.label}
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="text-xs leading-relaxed text-muted-foreground">
                We reply by email{email ? ` (${email})` : ""} and SMS. Include message IDs or
                campaign names when reporting delivery issues.
              </p>
            </AppCardBody>
          </AppCard>
        </div>
      </div>
    </div>
  );
}
