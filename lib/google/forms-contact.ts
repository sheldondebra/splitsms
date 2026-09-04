import { prisma } from "@/lib/db";
import { detectCountryCode } from "@/lib/contacts/country-from-phone";
import { runContactSignupAutomations } from "@/lib/automation/dispatch";

/** Save (or update) a form respondent as a Contact once their SMS has sent successfully. */
export async function saveGoogleFormRespondentAsContact(params: {
  userId: string;
  phone: string;
  name: string | null;
  contactGroupId: string | null;
}): Promise<string | null> {
  const phone = params.phone.startsWith("+") ? params.phone : `+${params.phone.replace(/^0+/, "")}`;
  const countryCode = detectCountryCode(phone);

  const existing = await prisma.contact.findUnique({
    where: { userId_phone: { userId: params.userId, phone } },
  });

  const contact = await prisma.contact.upsert({
    where: { userId_phone: { userId: params.userId, phone } },
    update: {
      name: params.name ?? undefined,
      countryCode,
      tags: existing?.tags?.includes("google-form")
        ? existing.tags
        : [existing?.tags, "google-form"].filter(Boolean).join(", "),
    },
    create: {
      userId: params.userId,
      phone,
      name: params.name,
      countryCode,
      tags: "google-form",
    },
  });

  if (params.contactGroupId) {
    await prisma.contactGroupMember.upsert({
      where: {
        groupId_contactId: { groupId: params.contactGroupId, contactId: contact.id },
      },
      update: {},
      create: { groupId: params.contactGroupId, contactId: contact.id },
    });
  }

  if (!existing) {
    void runContactSignupAutomations(params.userId, {
      phone,
      name: params.name ?? undefined,
      countryCode,
    });
  }

  return contact.id;
}
