import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  buildSupportChatMessages,
  formatTicketNumber,
  ticketToChatRow,
} from "@/lib/support/chat";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { fullName: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "asc" },
    take: 50,
    select: {
      id: true,
      subject: true,
      message: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const firstName = user.fullName.split(" ")[0] ?? "there";
  const rows = tickets.map((t) => ticketToChatRow(t));
  const messages = buildSupportChatMessages(firstName, rows);

  const latestUpdate =
    tickets.length > 0
      ? tickets.reduce(
          (max, t) => (t.updatedAt > max ? t.updatedAt : max),
          tickets[0]!.updatedAt,
        )
      : new Date();

  return NextResponse.json({
    messages,
    updatedAt: latestUpdate.toISOString(),
    ticketCount: tickets.length,
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { message?: string };
  try {
    body = (await request.json()) as { message?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = String(body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const subject = message.length > 60 ? `${message.slice(0, 57)}...` : message;

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: session.userId,
      subject,
      message,
    },
    select: {
      id: true,
      subject: true,
      message: true,
      status: true,
      createdAt: true,
    },
  });

  const ticketNumber = formatTicketNumber(ticket.id, ticket.createdAt);
  const row = ticketToChatRow(ticket);

  return NextResponse.json({
    ok: true,
    ticket: {
      id: ticket.id,
      ticketNumber,
      subject: ticket.subject,
      message: ticket.message,
      status: ticket.status,
      createdAt: ticket.createdAt.toISOString(),
    },
    row,
  });
}
