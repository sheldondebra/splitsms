import JSZip from "jszip";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { backupReadyEmailContent } from "@/lib/email/templates";
import { appendRawChunk, readRawChunks, readRawObject, deleteRawChunks, writeZipChunks, readZipBuffer } from "@/lib/backups/chunks";
import { BACKUP_TASKS, tasksForCategories, type BackupTaskId } from "@/lib/backups/tasks";
import { BATCH_SIZE, MAX_BACKUP_EMAIL_ATTACHMENT_BYTES } from "@/lib/backups/types";
import type { BackupCategoryId, BackupFilters, CategoryProgress } from "@/lib/backups/types";

function emptyProgress(): CategoryProgress {
  return { done: false, exported: 0, total: 0, cursor: null, chunkIndex: 0 };
}

export async function createBackupJob(input: {
  categories: BackupCategoryId[];
  filters?: BackupFilters;
  emailTo?: string | null;
  createdById: string;
}) {
  const tasks = tasksForCategories(input.categories);
  const filters = input.filters ?? {};
  const progress: Partial<Record<BackupTaskId, CategoryProgress>> = {};
  let totalSteps = 0;
  for (const task of tasks) {
    const count = await task.count(filters);
    const steps = task.kind === "csv" ? 1 : Math.max(1, Math.ceil(count / 500));
    progress[task.id] = { ...emptyProgress(), total: count };
    totalSteps += count === 0 ? 0 : steps;
  }
  totalSteps += 1; // finalize step

  const job = await prisma.backupJob.create({
    data: {
      status: "RUNNING",
      categories: input.categories,
      filters: filters as object,
      progress: progress as object,
      totalSteps,
      completedSteps: 0,
      emailTo: input.emailTo ?? null,
      createdById: input.createdById,
    },
  });
  return job;
}

function nextPendingTask(job: {
  categories: unknown;
  progress: unknown;
}): { task: (typeof BACKUP_TASKS)[number]; progress: CategoryProgress } | null {
  const categories = job.categories as BackupCategoryId[];
  const progressMap = (job.progress as Record<string, CategoryProgress>) ?? {};
  const tasks = tasksForCategories(categories);
  for (const task of tasks) {
    const p = progressMap[task.id] ?? emptyProgress();
    if (!p.done && p.total > 0) {
      return { task, progress: p };
    }
  }
  return null;
}

export async function stepBackupJob(id: string) {
  const job = await prisma.backupJob.findUnique({ where: { id } });
  if (!job) throw new Error("Backup job not found");
  if (job.status !== "RUNNING") {
    return { done: true, status: job.status, percent: 100 };
  }

  const filters = (job.filters as BackupFilters) ?? {};
  const pending = nextPendingTask(job);

  if (pending) {
    const { task, progress } = pending;
    if (task.kind === "csv") {
      const csv = await task.exportAll!(filters);
      await appendRawChunk(job.id, task.id, 0, { csv });
      const updatedProgress = {
        ...(job.progress as object),
        [task.id]: { done: true, exported: 1, total: 1, cursor: null, chunkIndex: 1 },
      };
      const completedSteps = job.completedSteps + 1;
      await prisma.backupJob.update({
        where: { id },
        data: { progress: updatedProgress, completedSteps },
      });
      return { done: false, percent: Math.round((completedSteps / job.totalSteps) * 100) };
    }

    const batch = await task.exportBatch!(progress.cursor, filters);
    await appendRawChunk(job.id, task.id, progress.chunkIndex, batch.rows);
    const exported = progress.exported + batch.rows.length;
    const updatedProgress = {
      ...(job.progress as object),
      [task.id]: {
        done: batch.done,
        exported,
        total: progress.total,
        cursor: batch.nextCursor,
        chunkIndex: progress.chunkIndex + 1,
      },
    };
    const completedSteps = job.completedSteps + 1;
    await prisma.backupJob.update({
      where: { id },
      data: { progress: updatedProgress, completedSteps },
    });
    return { done: false, percent: Math.round((completedSteps / job.totalSteps) * 100) };
  }

  // Every task is done — finalize: build the zip from raw chunks.
  const zip = new JSZip();
  const categories = job.categories as BackupCategoryId[];
  const tasks = tasksForCategories(categories);
  const manifest: Record<string, unknown> = {
    createdAt: new Date().toISOString(),
    categories,
    filters,
  };
  for (const task of tasks) {
    if (task.kind === "csv") {
      const obj = await readRawObject(job.id, task.id);
      zip.file(task.filename, (obj?.csv as string) ?? "");
    } else {
      const rows = await readRawChunks(job.id, task.id);
      zip.file(task.filename, JSON.stringify(rows, null, 2));
      manifest[task.id] = rows.length;
    }
  }
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  await writeZipChunks(job.id, buffer);
  await deleteRawChunks(job.id);

  const completedSteps = job.completedSteps + 1;
  await prisma.backupJob.update({
    where: { id },
    data: {
      status: "COMPLETED",
      completedSteps,
      fileSizeBytes: buffer.length,
      completedAt: new Date(),
    },
  });

  if (job.emailTo) {
    const downloadUrl = `${process.env.APP_URL ?? "https://splitsms.com"}/api/admin/backups/${job.id}/download`;
    const attach = buffer.length <= MAX_BACKUP_EMAIL_ATTACHMENT_BYTES;
    const content = await backupReadyEmailContent({
      categories: categories.map((c) => c),
      sizeBytes: buffer.length,
      downloadUrl,
      attached: attach,
    });
    const zipFilename = `splitsms-backup-${job.id.slice(0, 8)}.zip`;
    await sendEmail({
      to: job.emailTo,
      subject: content.subject,
      text: content.text,
      html: content.html,
      attachments: attach
        ? [{ filename: zipFilename, content: buffer, contentType: "application/zip" }]
        : undefined,
    }).catch(() => null);
  }

  return { done: true, percent: 100, status: "COMPLETED" as const };
}

export async function markBackupFailed(id: string, error: string) {
  await prisma.backupJob.update({ where: { id }, data: { status: "FAILED", error } });
}

// ---------------------------------------------------------------------------
// Restore — insert-only, walks the same tasks in the same (dependency-safe) order.
// ---------------------------------------------------------------------------

export type RestoreState = {
  taskIndex: number;
  rowOffset: number;
  inserted: number;
  skipped: number;
  done: boolean;
};

export async function stepRestoreJob(backupId: string, state: RestoreState): Promise<RestoreState> {
  const job = await prisma.backupJob.findUnique({ where: { id: backupId } });
  if (!job) throw new Error("Backup job not found");
  const categories = job.categories as BackupCategoryId[];
  const tasks = tasksForCategories(categories).filter((t) => t.restoreBatch);

  if (state.taskIndex >= tasks.length) {
    return { ...state, done: true };
  }

  const task = tasks[state.taskIndex]!;
  const zip = await readZipBuffer(backupId);
  if (!zip) throw new Error("Backup file missing — cannot restore");
  const archive = await JSZip.loadAsync(zip);
  const file = archive.file(task.filename);
  const allRows: unknown[] = file ? JSON.parse(await file.async("string")) : [];
  const slice = allRows.slice(state.rowOffset, state.rowOffset + BATCH_SIZE);

  const result = slice.length > 0 ? await task.restoreBatch!(slice) : { inserted: 0, skipped: 0 };
  const nextOffset = state.rowOffset + slice.length;
  const taskDone = nextOffset >= allRows.length;

  return {
    taskIndex: taskDone ? state.taskIndex + 1 : state.taskIndex,
    rowOffset: taskDone ? 0 : nextOffset,
    inserted: state.inserted + result.inserted,
    skipped: state.skipped + result.skipped,
    done: taskDone && state.taskIndex + 1 >= tasks.length,
  };
}
