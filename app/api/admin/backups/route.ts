import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBackupRead, requireBackupWrite } from "@/lib/backups/auth";
import { createBackupJob } from "@/lib/backups/engine";
import { BACKUP_CATEGORY_IDS, type BackupCategoryId, type BackupFilters } from "@/lib/backups/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireBackupRead();
  if (!auth.ok) return auth.response;

  const jobs = await prisma.backupJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { createdBy: { select: { fullName: true } } },
  });

  return NextResponse.json({
    jobs: jobs.map((j) => ({
      id: j.id,
      status: j.status,
      categories: j.categories,
      totalSteps: j.totalSteps,
      completedSteps: j.completedSteps,
      fileSizeBytes: j.fileSizeBytes,
      emailTo: j.emailTo,
      error: j.error,
      createdByName: j.createdBy?.fullName ?? "—",
      createdAt: j.createdAt,
      completedAt: j.completedAt,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireBackupWrite();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const categories = Array.isArray(body?.categories)
    ? (body.categories as string[]).filter((c): c is BackupCategoryId =>
        (BACKUP_CATEGORY_IDS as readonly string[]).includes(c),
      )
    : [];
  if (categories.length === 0) {
    return NextResponse.json({ error: "Select at least one category" }, { status: 400 });
  }

  const filters: BackupFilters = {
    messageStatuses: Array.isArray(body?.filters?.messageStatuses)
      ? body.filters.messageStatuses
      : undefined,
    dateFrom: typeof body?.filters?.dateFrom === "string" ? body.filters.dateFrom : undefined,
    dateTo: typeof body?.filters?.dateTo === "string" ? body.filters.dateTo : undefined,
  };
  const emailTo = typeof body?.emailTo === "string" && body.emailTo.trim() ? body.emailTo.trim() : null;

  const job = await createBackupJob({
    categories,
    filters,
    emailTo,
    createdById: auth.session.userId,
  });

  return NextResponse.json({ id: job.id });
}
