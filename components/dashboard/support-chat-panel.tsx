"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Headphones, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatChatTime,
  formatTicketNumber,
  ticketAckMessage,
  type SupportTicketChatRow,
} from "@/lib/support/chat";
import {
  getChatTicketTag,
  isTicketThreadClosed,
} from "@/lib/support/meta";

export type ChatMessage = {
  id: string;
  role: "support" | "user";
  body: string;
  time: string;
  status?: string;
  ticketNumber?: string;
  ticketId?: string;
  ticketStatus?: string;
};

type ChatThread = {
  key: string;
  ticketId: string | null;
  ticketNumber?: string;
  ticketStatus?: string;
  messages: ChatMessage[];
};

type SupportChatPanelProps = {
  initialMessages: ChatMessage[];
  draftMessage?: string;
  poll?: boolean;
};

const POLL_MS = 4000;

function groupChatMessages(messages: ChatMessage[]): ChatThread[] {
  const threads: ChatThread[] = [];
  let current: ChatThread | null = null;

  for (const msg of messages) {
    if (!msg.ticketNumber) {
      threads.push({ key: msg.id, ticketId: null, messages: [msg] });
      current = null;
      continue;
    }

    const ticketKey = msg.ticketId ?? msg.ticketNumber;
    if (!current || current.ticketId !== ticketKey) {
      current = {
        key: ticketKey,
        ticketId: ticketKey,
        ticketNumber: msg.ticketNumber,
        ticketStatus: msg.ticketStatus,
        messages: [],
      };
      threads.push(current);
    }
    current.messages.push(msg);
    if (msg.ticketStatus) current.ticketStatus = msg.ticketStatus;
  }

  return threads;
}

function threadHasStaffReply(messages: ChatMessage[]) {
  return messages.some((m) => m.role === "support" && !m.id.startsWith("reply-"));
}

export function SupportChatPanel({
  initialMessages,
  draftMessage = "",
  poll = true,
}: SupportChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialMessagesKey = initialMessages
    .map((m) => `${m.id}:${m.body.length}:${m.ticketStatus ?? ""}`)
    .join("|");
  const [messages, setMessages] = useState(initialMessages);
  const [messagesKey, setMessagesKey] = useState(initialMessagesKey);

  if (initialMessagesKey !== messagesKey) {
    setMessagesKey(initialMessagesKey);
    setMessages(initialMessages);
  }

  const threads = useMemo(() => groupChatMessages(messages), [messages]);

  const [text, setText] = useState(draftMessage);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const lastSyncRef = useRef<string>("");
  const [, startTransition] = useTransition();

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, sending]);

  const syncFromServer = useCallback(async (silent = true) => {
    if (!poll) return;
    try {
      if (!silent) setIsPolling(true);
      const res = await fetch("/api/support/chat", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        messages: ChatMessage[];
        updatedAt: string;
      };
      if (data.updatedAt && data.messages) {
        if (data.updatedAt !== lastSyncRef.current) {
          setMessages(data.messages);
          lastSyncRef.current = data.updatedAt;
        }
      }
    } catch {
      /* ignore poll errors */
    } finally {
      if (!silent) setIsPolling(false);
    }
  }, [poll]);

  useEffect(() => {
    if (!poll) return;
    const id = setInterval(() => {
      void syncFromServer(true);
    }, POLL_MS);
    return () => clearInterval(id);
  }, [poll, syncFromServer]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const message = text.trim();
    if (!message || sending) return;

    setError(null);
    setSending(true);

    const optimisticId = `pending-${Date.now()}`;
    const now = new Date();
    const optimisticUser: ChatMessage = {
      id: optimisticId,
      role: "user",
      body: message,
      time: formatChatTime(now),
      status: "OPEN",
      ticketStatus: "OPEN",
    };

    setMessages((prev) => [...prev, optimisticUser]);
    setText("");

    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        ticket?: {
          id: string;
          ticketNumber: string;
          message: string;
          status: string;
          createdAt: string;
        };
        row?: SupportTicketChatRow;
      };

      if (!res.ok || !data.ticket) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setText(message);
        setError(data.error ?? "Could not send message. Please try again.");
        return;
      }

      const row: SupportTicketChatRow = data.row ?? {
        id: data.ticket.id,
        message: data.ticket.message,
        status: data.ticket.status,
        createdAt: data.ticket.createdAt,
      };

      const ticketNumber = data.ticket.ticketNumber ?? formatTicketNumber(row.id, row.createdAt);

      setMessages((prev) => {
        const withoutPending = prev.filter((m) => m.id !== optimisticId);
        return [
          ...withoutPending,
          {
            id: data.ticket!.id,
            role: "user" as const,
            body: data.ticket!.message,
            time: formatChatTime(data.ticket!.createdAt),
            ticketNumber,
            ticketId: data.ticket!.id,
            ticketStatus: data.ticket!.status,
          },
          {
            id: `reply-${data.ticket!.id}`,
            role: "support" as const,
            body: ticketAckMessage(row),
            time: "SplitSMS",
            ticketNumber,
            ticketId: data.ticket!.id,
            ticketStatus: data.ticket!.status,
          },
        ];
      });

      startTransition(() => {
        void syncFromServer(true);
      });
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setText(message);
      setError("Network error — check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-[min(420px,55vh)] max-h-[420px] rounded-2xl border border-border/60 bg-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border/50 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Headphones className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-none">Support chat</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Live · scroll for history</p>
        </div>
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            poll ? "bg-emerald-500 animate-pulse" : "bg-emerald-500",
          )}
        />
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-2.5 space-y-2.5 scroll-smooth"
      >
        {threads.map((thread) => {
          if (!thread.ticketId) {
            const msg = thread.messages[0]!;
            return (
              <div key={thread.key} className="flex justify-start">
                <div className="max-w-[92%] rounded-xl rounded-bl-sm bg-muted/70 px-2.5 py-2 text-xs leading-snug text-muted-foreground">
                  {msg.body}
                </div>
              </div>
            );
          }

          const status = thread.ticketStatus ?? "OPEN";
          const closed = isTicketThreadClosed(status);
          const hasStaff = threadHasStaffReply(thread.messages);
          const tag = getChatTicketTag(status, hasStaff);
          const TagIcon = tag.icon;

          return (
            <div
              key={thread.key}
              className={cn(
                "rounded-xl border px-2 py-2 space-y-1.5",
                closed
                  ? "border-border/40 bg-muted/20 opacity-55 saturate-50"
                  : "border-border/50 bg-card/50",
              )}
            >
              <div className="flex items-center justify-between gap-2 px-0.5">
                <p className="font-mono text-[9px] font-bold text-primary truncate">
                  {thread.ticketNumber}
                </p>
                <Badge
                  variant="outline"
                  className={cn("gap-0.5 text-[9px] px-1.5 py-0 h-5 shrink-0", tag.className)}
                >
                  <TagIcon className="h-2.5 w-2.5" />
                  {tag.label}
                </Badge>
              </div>

              {thread.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[90%] rounded-lg px-2.5 py-1.5 text-xs leading-snug",
                      msg.role === "user"
                        ? closed
                          ? "bg-muted text-muted-foreground rounded-br-sm"
                          : "bg-primary text-primary-foreground rounded-br-sm"
                        : closed
                          ? "bg-muted/60 text-muted-foreground rounded-bl-sm"
                          : "bg-muted/80 text-foreground rounded-bl-sm",
                    )}
                  >
                    <p className="line-clamp-4 break-words">{msg.body}</p>
                    <p
                      className={cn(
                        "text-[9px] mt-1 tabular-nums opacity-70",
                        msg.role === "user" && !closed && "text-primary-foreground/80",
                      )}
                    >
                      {msg.role === "support" ? "SplitSMS" : "You"} · {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        {sending && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-muted/80 px-2.5 py-1.5 text-xs text-muted-foreground flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Sending…
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-[10px] text-destructive px-3 pb-0.5 shrink-0">{error}</p>}

      {isPolling && (
        <p className="text-[9px] text-muted-foreground px-3 pb-0.5 shrink-0">Syncing…</p>
      )}

      <form onSubmit={handleSubmit} className="p-2 border-t border-border/50 shrink-0">
        <div className="flex gap-1.5 items-end rounded-lg border bg-muted/30 p-1.5 focus-within:ring-2 focus-within:ring-primary/20">
          <Textarea
            name="message"
            rows={1}
            placeholder="Quick question…"
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={sending}
            className="min-h-[36px] max-h-20 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 text-xs py-2"
          />
          <Button
            type="submit"
            size="icon"
            disabled={sending || !text.trim()}
            className="h-8 w-8 shrink-0 rounded-md"
          >
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
