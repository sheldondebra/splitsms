import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { SupportDashboard } from "@/components/dashboard/support-dashboard";
import { buildSupportChatMessages, formatTicketNumber } from "@/lib/support/chat";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { LifeBuoy } from "lucide-react";

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
  const chatMessages = buildSupportChatMessages(firstName, tickets);

  const rows = tickets.map((t) => ({
    id: t.id,
    ticketNumber: formatTicketNumber(t.id, t.createdAt),
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
