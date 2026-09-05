"use server";

import { revalidatePath } from "next/cache";
import { getRealSession as getSession, isAdminRole } from "@/lib/auth/session";
import { loadMaintenanceConfig, saveMaintenanceConfig, type MaintenanceConfig } from "@/lib/admin/maintenance";
import { notifyMembersOfMaintenance } from "@/lib/admin/maintenance-notify";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) throw new Error("Unauthorized");
  return session;
}

export async function getMaintenanceAudienceSizeAction(): Promise<number> {
  await requireAdmin();
  return prisma.user.count({ where: { role: "MEMBER" } });
}

export async function saveMaintenanceTemplatesAction(input: {
  message: string;
  startEmailSubject: string;
  startEmailBody: string;
  startSmsBody: string;
  endEmailSubject: string;
  endEmailBody: string;
  endSmsBody: string;
}): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const current = await loadMaintenanceConfig();
  await saveMaintenanceConfig({ ...current, ...input });
  revalidatePath("/admin/general");
  return { ok: true, message: "Maintenance messages saved." };
}

export async function toggleMaintenanceModeAction(input: {
  enabled: boolean;
  notifyEmail: boolean;
  notifySms: boolean;
}): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const current = await loadMaintenanceConfig();

  const next: MaintenanceConfig = {
    ...current,
    enabled: input.enabled,
    startedAt: input.enabled ? new Date().toISOString() : current.startedAt,
  };
  await saveMaintenanceConfig(next);
  revalidatePath("/admin/general");

  if (!input.notifyEmail && !input.notifySms) {
    return {
      ok: true,
      message: input.enabled ? "Maintenance mode is on." : "Maintenance mode is off.",
    };
  }

  const result = await notifyMembersOfMaintenance({
    event: input.enabled ? "start" : "end",
    config: next,
    notifyEmail: input.notifyEmail,
    notifySms: input.notifySms,
  });

  const parts: string[] = [];
  if (input.notifyEmail) parts.push(`${result.emailsSent} email${result.emailsSent === 1 ? "" : "s"}`);
  if (input.notifySms) parts.push(`${result.smsSent} SMS`);

  return {
    ok: true,
    message: `Maintenance mode is ${input.enabled ? "on" : "off"}. Notified ${parts.join(" and ")} (of ${result.audienceSize} members).`,
  };
}
