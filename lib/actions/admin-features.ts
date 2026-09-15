"use server";

import { revalidatePath } from "next/cache";
import { getRealSession as getSession, isAdminRole } from "@/lib/auth/session";
import { hasStaffPermission } from "@/lib/auth/admin-permissions";
import { prisma } from "@/lib/db";
import {
  isPlatformFeatureId,
  loadPlatformFeatureFlags,
  savePlatformFeatureFlags,
  type PlatformFeatureId,
} from "@/lib/platform/features";

async function requireFeaturesAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true, staffPermissions: true },
  });
  if (
    !user ||
    !hasStaffPermission(
      { role: user.role, staffPermissions: user.staffPermissions ?? [] },
      "settings.write",
    )
  ) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function togglePlatformFeatureAction(input: {
  id: string;
  enabled: boolean;
}): Promise<{ ok: boolean; message: string }> {
  await requireFeaturesAdmin();
  if (!isPlatformFeatureId(input.id)) {
    return { ok: false, message: "Unknown feature." };
  }

  const flags = await loadPlatformFeatureFlags();
  flags[input.id] = input.enabled;
  await savePlatformFeatureFlags(flags);
  revalidatePath("/admin/features");
  revalidatePath("/dashboard");
  return {
    ok: true,
    message: `${input.id.replaceAll("_", " ")} ${input.enabled ? "enabled" : "disabled"}.`,
  };
}

export async function setPlatformFeatureGroupAction(input: {
  ids: string[];
  enabled: boolean;
}): Promise<{ ok: boolean; message: string }> {
  await requireFeaturesAdmin();
  const flags = await loadPlatformFeatureFlags();
  const ids = input.ids.filter((id): id is PlatformFeatureId => isPlatformFeatureId(id));
  if (ids.length === 0) return { ok: false, message: "No features selected." };
  for (const id of ids) flags[id] = input.enabled;
  await savePlatformFeatureFlags(flags);
  revalidatePath("/admin/features");
  revalidatePath("/dashboard");
  return {
    ok: true,
    message: `${ids.length} feature${ids.length === 1 ? "" : "s"} ${input.enabled ? "enabled" : "disabled"}.`,
  };
}
