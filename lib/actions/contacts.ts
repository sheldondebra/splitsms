"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { normalizePhones } from "@/lib/sms/units";
import { parseContactsCsv, type CsvContactRow } from "@/lib/contacts/csv-import";
import { detectCountryCode } from "@/lib/contacts/country-from-phone";
import { runContactSignupAutomations } from "@/lib/automation/dispatch";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireUserId() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.userId;
}

async function importContactRows(userId: string, rows: CsvContactRow[]) {
  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row.phone?.trim()) {
      skipped++;
      continue;
    }

    try {
      const existing = await prisma.contact.findUnique({
        where: { userId_phone: { userId, phone: row.phone } },
      });
      const countryCode = row.countryCode ?? detectCountryCode(row.phone);
      await prisma.contact.upsert({
        where: { userId_phone: { userId, phone: row.phone } },
        update: {
          name: row.name,
          email: row.email,
          tags: row.tags,
          countryCode,
        },
        create: {
          userId,
          phone: row.phone,
          name: row.name,
          email: row.email,
          tags: row.tags,
          countryCode,
        },
      });
      if (!existing) {
        void runContactSignupAutomations(userId, {
          phone: row.phone,
          name: row.name,
          email: row.email,
          countryCode,
        });
      }
      imported++;
    } catch {
      skipped++;
    }
  }

  return { imported, skipped };
}

export async function importContactsCsvAction(formData: FormData) {
  const userId = await requireUserId();
  const csv = String(formData.get("csv") ?? "");
  const preview = parseContactsCsv(csv);
  const { imported, skipped } = await importContactRows(userId, preview.valid);

  redirect(
    `/dashboard/contacts?imported=${imported}&invalid=${preview.invalid.length + skipped}&dup=${preview.duplicates}`,
  );
}

export async function importContactsSelectedAction(formData: FormData) {
  const userId = await requireUserId();
  const raw = String(formData.get("contacts") ?? "");

  let rows: CsvContactRow[];
  try {
    const parsed = JSON.parse(raw) as CsvContactRow[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      redirect("/dashboard/contacts?error=import");
    }
    rows = parsed;
  } catch {
    redirect("/dashboard/contacts?error=import");
  }

  const { imported, skipped } = await importContactRows(userId, rows);

  redirect(
    `/dashboard/contacts?imported=${imported}&invalid=${skipped}`,
  );
}

export async function createContactAction(formData: FormData) {
  const userId = await requireUserId();
  const phone = normalizePhones(String(formData.get("phone") ?? ""))[0];
  if (!phone) redirect("/dashboard/contacts?error=phone");

  const existing = await prisma.contact.findUnique({
    where: { userId_phone: { userId, phone } },
  });
  const countryCode = detectCountryCode(phone);
  const name = String(formData.get("name") ?? "") || undefined;
  const email = String(formData.get("email") ?? "") || undefined;
  const tags = String(formData.get("tags") ?? "") || undefined;

  await prisma.contact.upsert({
    where: { userId_phone: { userId, phone } },
    update: { name, email, tags, countryCode },
    create: { userId, phone, name, email, tags, countryCode },
  });

  if (!existing) {
    void runContactSignupAutomations(userId, { phone, name, email, countryCode });
  }

  redirect("/dashboard/contacts");
}

export async function updateContactAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id"));
  await prisma.contact.updateMany({
    where: { id, userId },
    data: {
      name: String(formData.get("name") ?? "") || null,
      email: String(formData.get("email") ?? "") || null,
      tags: String(formData.get("tags") ?? "") || null,
    },
  });
  revalidatePath("/dashboard/contacts");
  redirect("/dashboard/contacts");
}

export async function deleteContactAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id"));
  await prisma.contact.deleteMany({ where: { id, userId } });
  revalidatePath("/dashboard/contacts");
  redirect("/dashboard/contacts");
}

export async function bulkDeleteContactsAction(formData: FormData) {
  const userId = await requireUserId();
  const ids = String(formData.get("ids") ?? "")
    .split(",")
    .filter(Boolean);
  if (ids.length) {
    await prisma.contact.deleteMany({ where: { userId, id: { in: ids } } });
  }
  revalidatePath("/dashboard/contacts");
  redirect("/dashboard/contacts");
}

export async function bulkTagContactsAction(formData: FormData) {
  const userId = await requireUserId();
  const ids = String(formData.get("ids") ?? "")
    .split(",")
    .filter(Boolean);
  const tag = String(formData.get("tag") ?? "").trim();
  if (!ids.length || !tag) redirect("/dashboard/contacts?error=tag");

  const contacts = await prisma.contact.findMany({
    where: { userId, id: { in: ids } },
  });
  for (const c of contacts) {
    const existing = c.tags?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];
    if (!existing.includes(tag)) existing.push(tag);
    await prisma.contact.update({
      where: { id: c.id },
      data: { tags: existing.join(", ") },
    });
  }
  revalidatePath("/dashboard/contacts");
  redirect("/dashboard/contacts");
}

export async function bulkMoveToGroupAction(formData: FormData) {
  const userId = await requireUserId();
  const ids = String(formData.get("ids") ?? "")
    .split(",")
    .filter(Boolean);
  const groupId = String(formData.get("groupId"));
  const group = await prisma.contactGroup.findFirst({ where: { id: groupId, userId } });
  if (!group || !ids.length) redirect("/dashboard/contacts?error=group");

  for (const contactId of ids) {
    await prisma.contactGroupMember.upsert({
      where: { groupId_contactId: { groupId, contactId } },
      update: {},
      create: { groupId, contactId },
    });
  }
  revalidatePath("/dashboard/contacts");
  redirect("/dashboard/contacts");
}

export async function createGroupAction(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!name) redirect("/dashboard/contacts?tab=groups&error=group");

  await prisma.contactGroup.create({
    data: { userId, name, description: description || undefined },
  });
  revalidatePath("/dashboard/contacts");
  redirect("/dashboard/contacts?tab=groups");
}

export async function renameGroupAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/dashboard/contacts?tab=groups&error=group");
  await prisma.contactGroup.updateMany({
    where: { id, userId },
    data: { name },
  });
  revalidatePath("/dashboard/contacts");
  redirect("/dashboard/contacts?tab=groups");
}

export async function deleteGroupAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id"));
  await prisma.contactGroup.deleteMany({ where: { id, userId } });
  revalidatePath("/dashboard/contacts");
  redirect("/dashboard/contacts?tab=groups");
}

export async function addContactToGroupAction(formData: FormData) {
  const userId = await requireUserId();
  const groupId = String(formData.get("groupId"));
  const contactId = String(formData.get("contactId"));
  const group = await prisma.contactGroup.findFirst({ where: { id: groupId, userId } });
  if (!group) redirect("/dashboard/contacts?error=group");

  await prisma.contactGroupMember.upsert({
    where: { groupId_contactId: { groupId, contactId } },
    update: {},
    create: { groupId, contactId },
  });
  redirect("/dashboard/contacts");
}

export async function removeContactFromGroupAction(formData: FormData) {
  const userId = await requireUserId();
  const groupId = String(formData.get("groupId"));
  const contactId = String(formData.get("contactId"));
  const group = await prisma.contactGroup.findFirst({ where: { id: groupId, userId } });
  if (!group) redirect("/dashboard/contacts");

  await prisma.contactGroupMember.deleteMany({
    where: { groupId, contactId },
  });
  redirect("/dashboard/contacts");
}
