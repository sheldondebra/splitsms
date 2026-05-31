import { prisma } from "@/lib/db";

export type SendContactOption = {
  id: string;
  name: string | null;
  phone: string;
};

export type SendContactGroupOption = {
  id: string;
  name: string;
  memberCount: number;
  contacts: SendContactOption[];
};

export async function getContactsForSendPicker(userId: string): Promise<{
  contacts: SendContactOption[];
  groups: SendContactGroupOption[];
  totalContacts: number;
}> {
  const [contacts, groups, totalContacts] = await Promise.all([
    prisma.contact.findMany({
      where: { userId },
      select: { id: true, name: true, phone: true },
      orderBy: [{ name: "asc" }, { phone: "asc" }],
      take: 5000,
    }),
    prisma.contactGroup.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { members: true } },
        members: {
          include: {
            contact: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    }),
    prisma.contact.count({ where: { userId } }),
  ]);

  return {
    contacts,
    groups: groups.map((g) => ({
      id: g.id,
      name: g.name,
      memberCount: g._count.members,
      contacts: g.members.map((m) => m.contact),
    })),
    totalContacts,
  };
}
