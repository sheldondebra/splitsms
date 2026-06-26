import "server-only";

import { prisma } from "@/lib/db";

const FIRST_REFERENCE = 1001;

export async function allocateSupportTicketReference(): Promise<number> {
  const agg = await prisma.supportTicket.aggregate({
    _max: { reference: true },
  });
  return Math.max(FIRST_REFERENCE, (agg._max.reference ?? FIRST_REFERENCE - 1) + 1);
}

/** Assign references to tickets created before the reference column existed. */
export async function backfillSupportTicketReferences(): Promise<number> {
  const missing = await prisma.supportTicket.findMany({
    where: { reference: null },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (missing.length === 0) return 0;

  let next = await allocateSupportTicketReference();
  for (const ticket of missing) {
    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { reference: next },
    });
    next += 1;
  }
  return missing.length;
}

export async function createSupportTicket(input: {
  userId: string;
  subject: string;
  message: string;
}) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const reference = await allocateSupportTicketReference();
    try {
      const ticket = await prisma.supportTicket.create({
        data: {
          userId: input.userId,
          subject: input.subject,
          message: input.message,
          reference,
        },
      });
      const { notifySupportTicketOpened } = await import("@/lib/support/notifications");
      void notifySupportTicketOpened(ticket.id).catch(() => undefined);
      return ticket;
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === "P2002" && attempt < 4) continue;
      throw error;
    }
  }
  throw new Error("Could not allocate support ticket reference");
}
