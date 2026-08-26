import { NextResponse } from "next/server";
import { getAdminLiveUpdateNavCounts } from "@/lib/admin/live-update";
import { liveUpdateNavStatusPayload } from "@/lib/admin/live-update-nav";
import { getRealSession, isAdminRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const session = await getRealSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const counts = await getAdminLiveUpdateNavCounts();
  return NextResponse.json(liveUpdateNavStatusPayload(counts), {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
