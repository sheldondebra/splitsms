import { NextResponse } from "next/server";
import { requireBackupRead } from "@/lib/backups/auth";
import { readZipBuffer } from "@/lib/backups/chunks";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireBackupRead();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const job = await prisma.backupJob.findUnique({ where: { id }, select: { status: true, createdAt: true } });
  if (!job || job.status !== "COMPLETED") {
    return NextResponse.json({ error: "Backup not ready" }, { status: 404 });
  }

  const zip = await readZipBuffer(id);
  if (!zip) {
    return NextResponse.json({ error: "Backup file missing" }, { status: 404 });
  }

  const filename = `splitsms-backup-${job.createdAt.toISOString().slice(0, 10)}-${id.slice(0, 8)}.zip`;
  return new NextResponse(zip as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
