import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { SupportDashboard } from "@/components/dashboard/support-dashboard";
import type { ChatMessage } from "@/components/dashboard/support-chat-panel";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { LifeBuoy } from "lucide-react";

function buildChatMessages(
  firstName: string,
  tickets: { id: string; message: string; status: string; createdAt: Date }[],
): ChatMessage[] {
  const messages: ChatMessage[] = [
    {
      id: "welcome",
      role: "support",
      body: `Hi ${firstName}! How can we help? Ask about billing, delivery reports, or Sender IDs.`,
      time: "SplitSMS",
    },
  ];

  for (const t of [...tickets].reverse()) {
    messages.push({
      id: t.id,
      role: "user",
      body: t.message,
      time: t.createdAt.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: t.status === "OPEN" ? "Open" : t.status,
    });
  }

  if (tickets.some((t) => t.status.toUpperCase() === "OPEN")) {
    messages.push({
      id: "ack-latest",
      role: "support",
      body: "Thanks — we've received your message. Our team will follow up shortly.",
      time: "SplitSMS",
    });
  }

  return messages;
}

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;

  const [user, tickets] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { fullName: true, email: true },
    }),
    prisma.supportTicket.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        subject: true,
        message: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  if (!user) return null;

  const firstName = user.fullName.split(" ")[0] ?? "there";
  const chatMessages = buildChatMessages(
    firstName,
    [...tickets].reverse().slice(-12),
  );

  const rows = tickets.map((t) => ({
    id: t.id,
    subject: t.subject,
    message: t.message,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <AppPage wide>
      <PageHeader
        title="Support"
        description="Chat with our team, track requests, and get help with billing, delivery, and your account."
        icon={LifeBuoy}
        mobileDescription="Message support, view tickets, and browse help links."
      />

      <SupportDashboard
        firstName={firstName}
        email={user.email}
        chatMessages={chatMessages}
        tickets={rows}
        sent={params.sent === "1"}
        error={params.error}
      />
    </AppPage>
  );
}
