"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getAccessTokenForUser } from "@/lib/google/connection";
import { createGoogleContact } from "@/lib/google/people";
import { GOOGLE_CONTACTS_EXPORT_SCOPES } from "@/lib/google/scopes";
import { googleConnectHref } from "@/lib/google/connect-url";

async function requireUserId() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.userId;
}

export async function exportContactsToGoogleAction(formData: FormData) {
  const userId = await requireUserId();
  const mode = String(formData.get("mode") ?? "selected");
  const rawIds = String(formData.get("contactIds") ?? "");

  let contactIds: string[] = [];
  if (mode === "all") {
    const rows = await prisma.contact.findMany({
      where: { userId },
      select: { id: true },
      take: 2000,
    });
    contactIds = rows.map((r) => r.id);
  } else {
    try {
      const parsed = JSON.parse(rawIds) as string[];
      if (!Array.isArray(parsed)) redirect("/dashboard/contacts?error=export");
      contactIds = parsed.filter((id) => typeof id === "string");
    } catch {
      redirect("/dashboard/contacts?error=export");
    }
  }

  if (contactIds.length === 0) {
    redirect("/dashboard/contacts?error=export_empty");
  }

  const token = await getAccessTokenForUser(userId, [...GOOGLE_CONTACTS_EXPORT_SCOPES]);
  if (!token.ok) {
    const href = googleConnectHref({
      scopes: token.missingScopes?.length
        ? token.missingScopes
        : [...GOOGLE_CONTACTS_EXPORT_SCOPES],
      returnTo: "/dashboard/contacts",
      force: token.code === "reconnect",
    });
    redirect(href);
  }

  const contacts = await prisma.contact.findMany({
    where: { userId, id: { in: contactIds } },
    take: 2000,
  });

  let exported = 0;
  let failed = 0;
  for (const contact of contacts) {
    const result = await createGoogleContact(token.accessToken, {
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
    });
    if (result.ok) exported++;
    else failed++;
  }

  revalidatePath("/dashboard/contacts");
  redirect(
    `/dashboard/contacts?exported=${exported}${failed ? `&exportFailed=${failed}` : ""}`,
  );
}
