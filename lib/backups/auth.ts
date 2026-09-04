import { NextResponse } from "next/server";
import { getRealSession, isAdminRole, isSuperAdmin, type SessionPayload } from "@/lib/auth/session";
import { hasStaffPermission, type AdminPermission } from "@/lib/auth/admin-permissions";
import { prisma } from "@/lib/db";

type AuthResult =
  | { ok: true; session: SessionPayload }
  | { ok: false; response: NextResponse };

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function requireStaffPermission(required: AdminPermission): Promise<AuthResult> {
  const session = await getRealSession();
  if (!session || !isAdminRole(session.role)) {
    return { ok: false, response: unauthorized() };
  }
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { staffPermissions: true },
  });
  const allowed = hasStaffPermission(
    { role: session.role, staffPermissions: user?.staffPermissions ?? [] },
    required,
  );
  if (!allowed) {
    return { ok: false, response: unauthorized() };
  }
  return { ok: true, session };
}

export function requireBackupRead() {
  return requireStaffPermission("backups.read");
}

export function requireBackupWrite() {
  return requireStaffPermission("backups.write");
}

export async function requireSuperAdminForBackups(): Promise<AuthResult> {
  const session = await getRealSession();
  if (!session || !isSuperAdmin(session.role)) {
    return { ok: false, response: unauthorized() };
  }
  return { ok: true, session };
}
