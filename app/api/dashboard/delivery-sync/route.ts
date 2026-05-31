import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { syncUserPendingMnotifyDeliveries } from "@/lib/sms/sync-mnotify-dlr";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncUserPendingMnotifyDeliveries(session.userId, 40);
  return NextResponse.json({ success: true, ...result });
}
