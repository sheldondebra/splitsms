import type { ChatMessage } from "@/components/dashboard/support-chat-panel";
import { formatTicketReference } from "@/lib/support/ticket-format";

export type SupportTicketChatRow = {
  id: string;
  reference: number | null;
  message: string;
  status: string;
  createdAt: Date | string;
  subject?: string;
  replies?: {
    id: string;
    body: string;
    isStaff: boolean;
    createdAt: Date | string;
    authorName?: string | null;
  }[];
};

export function formatTicketNumber(reference: number | null | undefined): string | undefined {
  if (reference == null) return undefined;
  return formatTicketReference(reference);
}

export function formatChatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ticketAckMessage(ticket: SupportTicketChatRow): string {
  const ref = formatTicketNumber(ticket.reference);
  return ref ? `Received (${ref}). We'll reply by email or SMS.` : "Received. We'll reply by email or SMS.";
}

export function buildSupportChatMessages(
  firstName: string,
  tickets: SupportTicketChatRow[],
): ChatMessage[] {
  const messages: ChatMessage[] = [
    {
      id: "welcome",
      role: "support",
      body: `Hi ${firstName}! Ask about billing, delivery, or Sender IDs.`,
      time: "SplitSMS",
    },
  ];

  const chronological = [...tickets].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  for (const t of chronological) {
    const ref = formatTicketNumber(t.reference);
    const ticketStatus = t.status;

    messages.push({
      id: t.id,
      role: "user",
      body: t.message,
      time: formatChatTime(t.createdAt),
      ticketNumber: ref,
      ticketId: t.id,
      ticketStatus,
    });

    const replies = [...(t.replies ?? [])].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    if (replies.length === 0) {
      messages.push({
        id: `reply-${t.id}`,
        role: "support",
        body: ticketAckMessage(t),
        time: "SplitSMS",
        ticketNumber: ref,
        ticketId: t.id,
        ticketStatus,
      });
    } else {
      for (const r of replies) {
        messages.push({
          id: r.id,
          role: r.isStaff ? "support" : "user",
          body: r.body,
          time: r.isStaff ? formatChatTime(r.createdAt) : formatChatTime(r.createdAt),
          ticketNumber: ref,
          ticketId: t.id,
          ticketStatus,
        });
      }
    }
  }

  return messages;
}

export function ticketToChatRow(ticket: {
  id: string;
  reference: number | null;
  message: string;
  status: string;
  createdAt: Date;
  subject?: string;
  replies?: {
    id: string;
    body: string;
    isStaff: boolean;
    createdAt: Date;
    author?: { fullName: string } | null;
  }[];
}): SupportTicketChatRow {
  return {
    id: ticket.id,
    reference: ticket.reference,
    message: ticket.message,
    status: ticket.status,
    createdAt: ticket.createdAt.toISOString(),
    subject: ticket.subject,
    replies: ticket.replies?.map((r) => ({
      id: r.id,
      body: r.body,
      isStaff: r.isStaff,
      createdAt: r.createdAt.toISOString(),
      authorName: r.author?.fullName ?? null,
    })),
  };
}
