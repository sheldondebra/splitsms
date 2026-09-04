import { NextResponse } from "next/server";
import { requireBackupWrite } from "@/lib/backups/auth";
import { stepBackupJob, markBackupFailed } from "@/lib/backups/engine";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireBackupWrite();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  try {
    const result = await stepBackupJob(id);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    await markBackupFailed(id, error instanceof Error ? error.message : "Backup step failed");
    return NextResponse.json({ error: "Backup step failed" }, { status: 500 });
  }
}
