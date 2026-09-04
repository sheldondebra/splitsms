import { NextResponse } from "next/server";
import { requireSuperAdminForBackups } from "@/lib/backups/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdminForBackups();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  await prisma.backupJob.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
