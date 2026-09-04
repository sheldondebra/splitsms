import { NextResponse } from "next/server";
import { requireBackupWrite } from "@/lib/backups/auth";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { backupReadyEmailContent } from "@/lib/email/templates";
import { readZipBuffer } from "@/lib/backups/chunks";
import { MAX_BACKUP_EMAIL_ATTACHMENT_BYTES, type BackupCategoryId } from "@/lib/backups/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireBackupWrite();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const to = typeof body?.emailTo === "string" && body.emailTo.trim() ? body.emailTo.trim() : null;
  if (!to) {
    return NextResponse.json({ error: "An email address is required" }, { status: 400 });
  }

  const job = await prisma.backupJob.findUnique({ where: { id } });
  if (!job || job.status !== "COMPLETED" || !job.fileSizeBytes) {
    return NextResponse.json({ error: "Backup not ready" }, { status: 404 });
  }

  const downloadUrl = `${process.env.APP_URL ?? "https://splitsms.com"}/api/admin/backups/${job.id}/download`;
  const attach = job.fileSizeBytes <= MAX_BACKUP_EMAIL_ATTACHMENT_BYTES;
  const zipBuffer = attach ? await readZipBuffer(job.id) : null;
  const content = await backupReadyEmailContent({
    categories: (job.categories as BackupCategoryId[]).map((c) => c),
    sizeBytes: job.fileSizeBytes,
    downloadUrl,
    attached: Boolean(zipBuffer),
  });
  const zipFilename = `splitsms-backup-${job.id.slice(0, 8)}.zip`;
  const result = await sendEmail({
    to,
    subject: content.subject,
    text: content.text,
    html: content.html,
    attachments: zipBuffer
      ? [{ filename: zipFilename, content: zipBuffer, contentType: "application/zip" }]
      : undefined,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
