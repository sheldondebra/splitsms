import { getSession, clearSession, type SessionPayload } from "@/lib/auth/session";
import {
  getMemberAccountForUser,
  isMemberSuspended,
} from "@/lib/admin/member-account";
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

  return session;
}
