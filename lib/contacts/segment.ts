import type { Prisma } from "@/lib/generated/prisma/client";

export type ContactSegmentFilter = {
  q?: string;
  countryCode?: string;
  tag?: string;
  groupId?: string;
};

export function buildContactWhere(
  userId: string,
  filter: ContactSegmentFilter,
): Prisma.ContactWhereInput {
  const where: Prisma.ContactWhereInput = { userId };

  if (filter.q?.trim()) {
    const q = filter.q.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { email: { contains: q, mode: "insensitive" } },
      { tags: { contains: q, mode: "insensitive" } },
    ];
  }

  if (filter.countryCode) {
    where.countryCode = filter.countryCode.toUpperCase();
  }

  if (filter.tag) {
    where.tags = { contains: filter.tag, mode: "insensitive" };
  }

  if (filter.groupId) {
    where.groups = { some: { groupId: filter.groupId } };
  }

  return where;
}
