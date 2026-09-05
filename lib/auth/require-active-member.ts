import { getSession, clearSession, isAdminRole, type SessionPayload } from "@/lib/auth/session";
import {
  getMemberAccountForUser,
  isMemberSuspended,
} from "@/lib/admin/member-account";
import { isMaintenanceActive } from "@/lib/admin/maintenance";
import { redirect } from "next/navigation";

/** Use in dashboard/developers layouts (Node runtime). Edge middleware cannot use Prisma. */
export async function requireActiveMemberSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.role === "MEMBER") {
    const account = await getMemberAccountForUser(session.userId);
    if (isMemberSuspended(account)) {
      await clearSession();
      redirect("/login?error=suspended");
    }
  }

  if (!isAdminRole(session.role) && (await isMaintenanceActive())) {
    redirect("/maintenance");
  }

  return session;
}
