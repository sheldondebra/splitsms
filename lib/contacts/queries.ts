import { prisma } from "@/lib/db";
import { buildContactWhere } from "@/lib/contacts/segment";

export async function getContactsForUser(
  userId: string,
  params: { q?: string; country?: string; tag?: string; groupId?: string; page?: number },
) {
  const page = params.page ?? 1;
  const perPage = 50;
  const where = buildContactWhere(userId, {
    q: params.q,
    countryCode: params.country,
    tag: params.tag,
    groupId: params.groupId,
  });

  const [contacts, total, countryBreakdown] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { groups: { include: { group: true } } },
    }),
    prisma.contact.count({ where }),
    prisma.contact.groupBy({
      by: ["countryCode"],
      where: { userId },
      _count: { id: true },
    }),
  ]);

  return { contacts, total, page, perPage, countryBreakdown };
}
