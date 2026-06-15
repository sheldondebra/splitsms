"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { saveResponseAsContact } from "@/lib/smart-forms/save-contact";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireResponse(userId: string, formId: string, responseId: string) {
  const response = await prisma.smartFormResponse.findFirst({
    where: { id: responseId, formId, userId },
    select: { id: true, formId: true },
  });
  if (!response) throw new Error("Not found");
  return response;
}

export async function markResponseReviewedAction(formId: string, responseId: string) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Not signed in." };

  try {
    await requireResponse(session.userId, formId, responseId);
  } catch {
    return { ok: false as const, error: "Response not found." };
  }

  await prisma.smartFormResponse.update({
    where: { id: responseId },
    data: { reviewedAt: new Date() },
  });

  revalidatePath(`/dashboard/forms/${formId}/responses`);
  revalidatePath(`/dashboard/forms/${formId}/responses/${responseId}`);
  return { ok: true as const };
}

export async function saveResponseContactAction(formId: string, responseId: string) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Not signed in." };

  try {
    await requireResponse(session.userId, formId, responseId);
  } catch {
    return { ok: false as const, error: "Response not found." };
  }

  const result = await saveResponseAsContact(session.userId, responseId);
  revalidatePath(`/dashboard/forms/${formId}/responses`);
  revalidatePath(`/dashboard/forms/${formId}/responses/${responseId}`);

  if (result.status === "FAILED") {
    return { ok: false as const, error: "Could not save contact — phone number may be missing." };
  }
  return { ok: true as const, status: result.status };
}

export async function deleteResponseAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const formId = String(formData.get("formId") ?? "");
  const responseId = String(formData.get("responseId") ?? "");
  if (!formId || !responseId) redirect(`/dashboard/forms?error=invalid`);

  try {
    await requireResponse(session.userId, formId, responseId);
  } catch {
    redirect(`/dashboard/forms/${formId}/responses?error=notfound`);
  }

  await prisma.smartFormResponse.delete({ where: { id: responseId } });
  revalidatePath(`/dashboard/forms/${formId}/responses`);
  redirect(`/dashboard/forms/${formId}/responses?deleted=1`);
}
