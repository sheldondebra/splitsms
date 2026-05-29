"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
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

export type ChatMessage = {
  id: string;
  role: "support" | "user";
  body: string;
  time: string;
  status?: string;
  ticketNumber?: string;
};

type SupportChatPanelProps = {
  initialMessages: ChatMessage[];
  draftMessage?: string;
  /** Poll for ticket status updates (default true) */
  poll?: boolean;
};

const POLL_MS = 4000;

export function SupportChatPanel({
  initialMessages,
  draftMessage = "",
  poll = true,
}: SupportChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState(draftMessage);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const lastSyncRef = useRef<string>("");
  const [, startTransition] = useTransition();

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
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
      status: "Open",
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
            status: "Open",
            ticketNumber,
          },
          {
            id: `reply-${data.ticket!.id}`,
            role: "support" as const,
            body: ticketAckMessage(row),
            time: "SplitSMS",
            ticketNumber,
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
    <div className="rounded-2xl border border-border/60 bg-card flex flex-col h-full min-h-[420px] max-h-[560px] lg:max-h-none lg:min-h-[480px]">
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/50">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Headphones className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Support chat</p>
          <p className="text-xs text-muted-foreground">
            Live · ticket number on every reply
          </p>
        </div>
        <span
          className={cn(
            "h-2 w-2 rounded-full shrink-0",
            poll ? "bg-emerald-500 animate-pulse" : "bg-emerald-500",
          )}
          title={poll ? "Connected" : "Online"}
        />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted/80 text-foreground rounded-bl-md",
              )}
            >
              {msg.ticketNumber && msg.role === "support" && (
                <p className="text-[10px] font-bold uppercase tracking-wide text-primary mb-1.5">
                  {msg.ticketNumber}
                </p>
              )}
              <p>{msg.body}</p>
              <p
                className={cn(
                  "text-[10px] mt-1.5 tabular-nums",
                  msg.role === "user"
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground",
                )}
              >
                {msg.time}
                {msg.status ? ` · ${msg.status}` : ""}
                {msg.ticketNumber && msg.role === "user" ? ` · ${msg.ticketNumber}` : ""}
              </p>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-muted/80 px-3.5 py-2.5 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Creating your ticket…
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive px-4 pb-1">{error}</p>
      )}

      {isPolling && (
        <p className="text-[10px] text-muted-foreground px-4 pb-1">Syncing…</p>
      )}

      <form onSubmit={handleSubmit} className="p-3 pt-0 border-t border-border/50">
        <div className="flex gap-2 items-end rounded-xl border bg-muted/30 p-2 focus-within:ring-2 focus-within:ring-primary/20">
          <Textarea
            name="message"
            rows={2}
            placeholder="Ask about billing, delivery, Sender ID…"
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={sending}
            className="min-h-[44px] max-h-28 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm"
          />
          <Button
            type="submit"
            size="icon"
            disabled={sending || !text.trim()}
            className="h-10 w-10 shrink-0 rounded-lg"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
