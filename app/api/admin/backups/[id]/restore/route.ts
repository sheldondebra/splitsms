import { NextResponse } from "next/server";
import { requireSuperAdminForBackups } from "@/lib/backups/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdminForBackups();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  if (body?.confirm !== "RESTORE") {
    return NextResponse.json({ error: 'Type "RESTORE" to confirm' }, { status: 400 });
  }

  const { id } = await params;
  const job = await prisma.backupJob.findUnique({ where: { id }, select: { status: true } });
  if (!job || job.status !== "COMPLETED") {
    return NextResponse.json({ error: "Backup not ready to restore" }, { status: 404 });
  }

  return NextResponse.json({
    state: { taskIndex: 0, rowOffset: 0, inserted: 0, skipped: 0, done: false },
  });
}
