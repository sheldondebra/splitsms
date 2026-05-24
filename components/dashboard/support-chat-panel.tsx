"use client";

import { useRef, useEffect } from "react";
import { sendSupportMessageAction } from "@/lib/actions/support";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Headphones, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChatMessage = {
  id: string;
  role: "support" | "user";
  body: string;
  time: string;
  status?: string;
};

type SupportChatPanelProps = {
  messages: ChatMessage[];
  sent?: boolean;
  draftMessage?: string;
};

export function SupportChatPanel({ messages, sent, draftMessage = "" }: SupportChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, sent]);

  return (
    <div className="rounded-2xl border border-border/60 bg-card flex flex-col h-full min-h-[420px] max-h-[560px] lg:max-h-none lg:min-h-[480px]">
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/50">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Headphones className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Support chat</p>
          <p className="text-xs text-muted-foreground">We reply by email & SMS</p>
        </div>
        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Online" />
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted/80 text-foreground rounded-bl-md",
              )}
            >
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
              </p>
            </div>
          </div>
        ))}
      </div>

      {sent && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 px-4 pb-1">
          Message sent — our team will get back to you soon.
        </p>
      )}

      <form action={sendSupportMessageAction} className="p-3 pt-0 border-t border-border/50">
        <div className="flex gap-2 items-end rounded-xl border bg-muted/30 p-2 focus-within:ring-2 focus-within:ring-primary/20">
          <Textarea
            name="message"
            rows={2}
            placeholder="Ask about billing, delivery, Sender ID…"
            required
            defaultValue={draftMessage}
            className="min-h-[44px] max-h-28 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm"
          />
          <Button type="submit" size="icon" className="h-10 w-10 shrink-0 rounded-lg">
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
