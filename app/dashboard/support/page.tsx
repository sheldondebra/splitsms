import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { SupportDashboard } from "@/components/dashboard/support-dashboard";
import { buildSupportChatMessages, formatTicketNumber } from "@/lib/support/chat";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { LifeBuoy } from "lucide-react";

export const dynamic = "force-dynamic";

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
        replies: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            body: true,
            isStaff: true,
            createdAt: true,
            author: { select: { fullName: true } },
          },
        },
      },
    }),
  ]);

  if (!user) return null;

  const firstName = user.fullName.split(" ")[0] ?? "there";
  const chatMessages = buildSupportChatMessages(
    firstName,
    tickets.map((t) => ({
      id: t.id,
      message: t.message,
      status: t.status,
      createdAt: t.createdAt,
      subject: t.subject,
      replies: t.replies.map((r) => ({
        id: r.id,
        body: r.body,
        isStaff: r.isStaff,
        createdAt: r.createdAt,
        authorName: r.author?.fullName ?? null,
      })),
    })),
  );

  const rows = tickets.map((t) => ({
    id: t.id,
    ticketNumber: formatTicketNumber(t.id, t.createdAt),
    subject: t.subject,
    message: t.message,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
    replies: t.replies.map((r) => ({
      id: r.id,
      body: r.body,
      isStaff: r.isStaff,
      createdAt: r.createdAt.toISOString(),
      authorName: r.author?.fullName ?? null,
    })),
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
