import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export const SUPPORT_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
export type SupportTicketStatus = (typeof SUPPORT_STATUSES)[number];

export function isSupportTicketStatus(value: string): value is SupportTicketStatus {
  return SUPPORT_STATUSES.includes(value as SupportTicketStatus);
}

async function logSupportAdminAction(
  action: string,
  ticketId: string,
  adminId: string,
  metadata?: object,
) {
  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      action,
      entityType: "SupportTicket",
      entityId: ticketId,
      metadata: metadata ?? {},
    },
  });
}

export async function staffReplyToSupportTicket(input: {
  ticketId: string;
  adminId: string;
  body: string;
  status?: string;
  source?: "admin" | "slack";
}) {
  const body = input.body.trim();
  if (!body) return { ok: false as const, error: "empty" as const };

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: input.ticketId },
    select: { id: true, userId: true, status: true },
  });
  if (!ticket) return { ok: false as const, error: "notfound" as const };

  const nextStatus =
    input.status && isSupportTicketStatus(input.status)
      ? input.status
      : ticket.status === "OPEN"
        ? "IN_PROGRESS"
        : ticket.status;

  await prisma.$transaction([
    prisma.supportTicketReply.create({
      data: {
        ticketId: input.ticketId,
        authorId: input.adminId,
        body,
        isStaff: true,
      },
    }),
    prisma.supportTicket.update({
      where: { id: input.ticketId },
      data: { status: nextStatus },
    }),
  ]);

  const { notifyMemberSupportReply } = await import("@/lib/support/notifications");
  void notifyMemberSupportReply(input.ticketId, body).catch(() => undefined);

  const { postStaffReplyToSupportThread } = await import("@/lib/slack/support-threads");
  if (input.source !== "slack") {
    void postStaffReplyToSupportThread(input.ticketId, body).catch(() => undefined);
  }

  await logSupportAdminAction("SUPPORT_TICKET_REPLY", input.ticketId, input.adminId, {
    userId: ticket.userId,
    status: nextStatus,
    preview: body.slice(0, 120),
    source: input.source ?? "admin",
  });

  revalidatePath("/admin/support");
  revalidatePath("/dashboard/support");
  revalidatePath(`/admin/members/${ticket.userId}`);

  return { ok: true as const, userId: ticket.userId, status: nextStatus };
}

export async function updateSupportTicketStatus(input: {
  ticketId: string;
  adminId: string;
  status: string;
  source?: "admin" | "slack";
}) {
  if (!isSupportTicketStatus(input.status)) {
    return { ok: false as const, error: "invalid_status" as const };
  }

  const ticket = await prisma.supportTicket.update({
    where: { id: input.ticketId },
    data: { status: input.status },
    select: { id: true, userId: true, status: true },
  });

  const { notifyMemberSupportStatusUpdated } = await import("@/lib/support/notifications");
  void notifyMemberSupportStatusUpdated(input.ticketId, input.status).catch(() => undefined);

  const { postSupportStatusToThread } = await import("@/lib/slack/support-threads");
  void postSupportStatusToThread(input.ticketId, input.status, input.adminId).catch(() => undefined);

  await logSupportAdminAction("SUPPORT_TICKET_UPDATED", input.ticketId, input.adminId, {
    status: input.status,
    userId: ticket.userId,
    source: input.source ?? "admin",
  });

  revalidatePath("/admin/support");
  revalidatePath("/dashboard/support");
  revalidatePath(`/admin/members/${ticket.userId}`);

  return { ok: true as const, userId: ticket.userId, status: ticket.status };
}
