import { NextResponse } from "next/server";
import { getRealSession, isAdminRole } from "@/lib/auth/session";
import { getAdminLiveUpdateSnapshot } from "@/lib/admin/live-update";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const session = await getRealSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await getAdminLiveUpdateSnapshot();
  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
