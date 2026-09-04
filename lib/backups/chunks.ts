import { prisma } from "@/lib/db";

/** Append one batch of exported rows for a task as a new raw chunk (O(1), no rewrite). */
export async function appendRawChunk(
  backupId: string,
  category: string,
  index: number,
  rows: unknown,
) {
  await prisma.backupFileChunk.create({
    data: {
      backupId,
      kind: "RAW_JSON",
      category,
      index,
      dataJson: rows as object,
    },
  });
}

/** Read every raw chunk for one task, in order, and concatenate their row arrays. */
export async function readRawChunks(backupId: string, category: string): Promise<unknown[]> {
  const chunks = await prisma.backupFileChunk.findMany({
    where: { backupId, kind: "RAW_JSON", category },
    orderBy: { index: "asc" },
  });
  const rows: unknown[] = [];
  for (const chunk of chunks) {
    const value = chunk.dataJson;
    if (Array.isArray(value)) rows.push(...value);
  }
  return rows;
}

/** Read a single-shot raw chunk stored as an object (e.g. { csv: "..." }) for a task. */
export async function readRawObject(
  backupId: string,
  category: string,
): Promise<Record<string, unknown> | null> {
  const chunk = await prisma.backupFileChunk.findFirst({
    where: { backupId, kind: "RAW_JSON", category },
    orderBy: { index: "asc" },
  });
  return (chunk?.dataJson as Record<string, unknown> | undefined) ?? null;
}

export async function deleteRawChunks(backupId: string) {
  await prisma.backupFileChunk.deleteMany({ where: { backupId, kind: "RAW_JSON" } });
}

const ZIP_CHUNK_BYTES = 4 * 1024 * 1024;

/** Split the finished zip buffer into a handful of ~4MB rows for durable storage. */
export async function writeZipChunks(backupId: string, zip: Buffer) {
  let index = 0;
  for (let offset = 0; offset < zip.length; offset += ZIP_CHUNK_BYTES) {
    const slice = zip.subarray(offset, offset + ZIP_CHUNK_BYTES);
    await prisma.backupFileChunk.create({
      data: {
        backupId,
        kind: "ZIP_BYTES",
        index,
        dataBytes: new Uint8Array(slice),
      },
    });
    index += 1;
  }
}

/** Reassemble the zip file from its stored byte chunks, in order. */
export async function readZipBuffer(backupId: string): Promise<Buffer | null> {
  const chunks = await prisma.backupFileChunk.findMany({
    where: { backupId, kind: "ZIP_BYTES" },
    orderBy: { index: "asc" },
    select: { dataBytes: true },
  });
  if (chunks.length === 0) return null;
  return Buffer.concat(chunks.map((c) => c.dataBytes as Buffer));
}
