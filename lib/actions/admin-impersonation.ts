"use server";

import { prisma } from "@/lib/db";
import { getRealSession, isAdminRole } from "@/lib/auth/session";
import {
  clearImpersonationCookie,
  setImpersonationCookie,
} from "@/lib/auth/impersonation";
import { logStaffAction } from "@/lib/auth/staff-audit";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function startResellerImpersonationAction(formData: FormData) {
  const session = await getRealSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");

  const resellerId = String(formData.get("resellerId") ?? "");
  if (!resellerId) redirect("/admin/resellers");

  const reseller = await prisma.reseller.findUnique({
    where: { id: resellerId },
    include: {
      user: { select: { id: true, phone: true, fullName: true, role: true } },
    },
  });

  if (!reseller || reseller.status !== "APPROVED" || !reseller.isActive) {
    redirect(`/admin/resellers/${resellerId}?error=impersonate`);
  }

  await setImpersonationCookie({
    adminUserId: session.userId,
    targetUserId: reseller.userId,
    targetPhone: reseller.user.phone,
    resellerId: reseller.id,
    businessName: reseller.businessName,
  });

  await logStaffAction({
    actorId: session.userId,
    action: "RESELLER_IMPERSONATION_START",
    entityType: "Reseller",
    entityId: reseller.id,
    metadata: {
      targetUserId: reseller.userId,
      businessName: reseller.businessName,
      targetPhone: reseller.user.phone,
    },
  });

  revalidatePath("/reseller");
  revalidatePath(`/admin/resellers/${resellerId}`);
  redirect("/reseller");
}

export async function stopResellerImpersonationAction() {
  const session = await getRealSession();
  if (!session || !isAdminRole(session.role)) {
    await clearImpersonationCookie();
    redirect("/login");
  }

  const { readImpersonationCookie } = await import("@/lib/auth/impersonation");
  const imp = await readImpersonationCookie();

  await clearImpersonationCookie();

  if (imp) {
    await logStaffAction({
      actorId: session.userId,
      action: "RESELLER_IMPERSONATION_END",
      entityType: "Reseller",
      entityId: imp.resellerId,
      metadata: {
        targetUserId: imp.targetUserId,
        businessName: imp.businessName,
      },
    });
  }

  revalidatePath("/reseller");
  revalidatePath("/admin/resellers");
  redirect(imp ? `/admin/resellers/${imp.resellerId}` : "/admin/resellers");
}
