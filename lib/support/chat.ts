import type { ChatMessage } from "@/components/dashboard/support-chat-panel";

export type SupportTicketChatRow = {
  id: string;
  message: string;
  status: string;
  createdAt: Date | string;
  subject?: string;
};

/** Human-readable ticket reference, e.g. SMS-20260526-A3F9K */
export function formatTicketNumber(id: string, createdAt: Date | string): string {
  const d = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const datePart = d.toISOString().slice(0, 10).replace(/-/g, "");
  return `SMS-${datePart}-${id.slice(-5).toUpperCase()}`;
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
  const ref = formatTicketNumber(ticket.id, ticket.createdAt);
  return `Thanks — we've received your message. Your ticket number is ${ref}. Save this reference; our team will follow up by email or SMS.`;
}

export function buildSupportChatMessages(
  firstName: string,
  tickets: SupportTicketChatRow[],
): ChatMessage[] {
  const messages: ChatMessage[] = [
    {
      id: "welcome",
      role: "support",
      body: `Hi ${firstName}! How can we help? Ask about billing, delivery reports, or Sender IDs.`,
      time: "SplitSMS",
    },
  ];

  const chronological = [...tickets].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  for (const t of chronological) {
    const ref = formatTicketNumber(t.id, t.createdAt);
    messages.push({
      id: t.id,
      role: "user",
      body: t.message,
      time: formatChatTime(t.createdAt),
      status: t.status === "OPEN" ? "Open" : t.status,
      ticketNumber: ref,
    });
    messages.push({
      id: `reply-${t.id}`,
      role: "support",
      body: ticketAckMessage(t),
      time: "SplitSMS",
      ticketNumber: ref,
    });
  }

  return messages;
}

export function ticketToChatRow(ticket: {
  id: string;
  message: string;
  status: string;
  createdAt: Date;
  subject?: string;
}): SupportTicketChatRow {
  return {
    id: ticket.id,
    message: ticket.message,
    status: ticket.status,
    createdAt: ticket.createdAt.toISOString(),
    subject: ticket.subject,
  };
}
