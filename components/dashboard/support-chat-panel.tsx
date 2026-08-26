"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Headphones, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatChatTime,
  ticketAckMessage,
  type SupportTicketChatRow,
} from "@/lib/support/chat";
import {
  supportPresenceDotClass,
  type SupportPresence,
} from "@/lib/support/presence-meta";
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
  initialPresence?: SupportPresence;
  /** Render inside a parent card without extra border/radius */
  embedded?: boolean;
  className?: string;
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
  initialPresence,
  embedded = false,
  className,
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
  const [presence, setPresence] = useState<SupportPresence>(
    initialPresence ?? {
      status: "ONLINE",
      label: "Online",
      detail: "Live · scroll for history",
    },
  );
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
        presence?: SupportPresence;
        updatedAt: string;
      };
      if (data.presence) setPresence(data.presence);
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
          reference: number;
          ticketNumber: string;
          message: string;
          status: string;
          createdAt: string;
        };
        row?: SupportTicketChatRow;
      };

      if (!res.ok || !data.ticket?.ticketNumber) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setText(message);
        setError(data.error ?? "Could not send message. Please try again.");
        return;
      }

      const row: SupportTicketChatRow = data.row ?? {
        id: data.ticket!.id,
        reference: data.ticket!.reference,
        message: data.ticket!.message,
        status: data.ticket!.status,
        createdAt: data.ticket!.createdAt,
      };

      const ticketNumber = data.ticket!.ticketNumber;

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
    <div
      className={cn(
        "flex min-w-0 flex-col overflow-hidden",
        embedded
          ? "min-h-[360px] min-w-0 bg-transparent"
          : "flex h-[min(28rem,calc(100dvh-11.5rem))] max-h-[28rem] min-w-0 w-full rounded-2xl border border-border/60 bg-card md:h-[min(420px,55vh)] md:max-h-[420px]",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5 px-3 py-2.5 border-b border-border/50 shrink-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Headphones className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-none truncate">Support chat</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate" title={presence.detail}>
            {presence.detail}
          </p>
        </div>
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full shrink-0",
            supportPresenceDotClass(presence.status),
          )}
          title={presence.label}
          aria-label={`Support team ${presence.label.toLowerCase()}`}
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
                <div className="max-w-[92%] rounded-xl rounded-bl-sm bg-muted/70 px-2.5 py-2 text-sm leading-snug text-muted-foreground md:text-xs">
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
                {thread.ticketNumber ? (
                  <p className="font-mono text-[9px] font-bold text-primary truncate">
                    {thread.ticketNumber}
                  </p>
                ) : (
                  <span />
                )}
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
                      "max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-snug md:rounded-lg md:px-2.5 md:py-1.5 md:text-xs",
                      msg.role === "user"
                        ? closed
                          ? "bg-muted text-muted-foreground rounded-br-sm"
                          : "bg-primary text-primary-foreground rounded-br-sm"
                        : closed
                          ? "bg-muted/60 text-muted-foreground rounded-bl-sm"
                          : "bg-muted/80 text-foreground rounded-bl-sm",
                    )}
                  >
                    <p className="break-words">{msg.body}</p>
                    <p
                      className={cn(
                        "text-[10px] mt-1 tabular-nums opacity-70 md:text-[9px]",
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

      <form onSubmit={handleSubmit} className="border-t border-border/50 bg-background p-2.5 shrink-0 min-w-0">
        <div className="flex min-w-0 flex-nowrap items-center gap-2">
          <input
            type="text"
            name="message"
            placeholder="Message…"
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={sending}
            autoComplete="off"
            enterKeyHint="send"
            className="h-11 min-w-0 flex-1 rounded-full border border-border/60 bg-muted/40 px-4 text-base leading-none shadow-none outline-none placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15 disabled:opacity-50 md:h-10 md:text-sm"
          />
          <Button
            type="submit"
            disabled={sending || !text.trim()}
            className="app-btn-compact h-11 shrink-0 gap-1.5 rounded-full px-4 text-sm font-semibold md:h-10"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
