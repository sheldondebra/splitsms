"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getRealSession as getSession, isAdminRole } from "@/lib/auth/session";
import { saveGa4Config } from "@/lib/analytics/ga4-config";
import { withReturnParams } from "@/lib/admin/return-url";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/login");
  return session;
}

export async function saveGa4ConfigAction(formData: FormData) {
  const session = await requireAdmin();
  const returnTo = "/admin/site-traffic";

  await saveGa4Config(
    {
      enabled: formData.get("enabled") === "on",
      measurementId: String(formData.get("measurementId") ?? "").trim(),
      propertyId: String(formData.get("propertyId") ?? "").trim(),
    },
    session.userId,
  );

  revalidatePath("/admin/site-traffic");
  revalidatePath("/", "layout");
  redirect(withReturnParams(returnTo, { saved: "ga4" }));
}
