import { NextResponse } from "next/server";
import { requireSuperAdminForBackups } from "@/lib/backups/auth";
import { stepRestoreJob, type RestoreState } from "@/lib/backups/engine";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdminForBackups();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const state = body?.state as RestoreState | undefined;
  if (
    !state ||
    typeof state.taskIndex !== "number" ||
    typeof state.rowOffset !== "number" ||
    typeof state.inserted !== "number" ||
    typeof state.skipped !== "number"
  ) {
    return NextResponse.json({ error: "Missing restore state" }, { status: 400 });
  }

  try {
    const next = await stepRestoreJob(id, state);
    return NextResponse.json({ state: next }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Restore step failed" },
      { status: 500 },
    );
  }
}
