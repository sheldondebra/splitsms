import { NextResponse } from "next/server";
import { z } from "zod";
import { getRealSession, isAdminRole } from "@/lib/auth/session";
import { requestWordPressSitesUpdate } from "@/lib/wordpress/admin";

const schema = z.object({ ids: z.array(z.string()).min(1).max(500) });

export async function POST(request: Request) {
  const session = await getRealSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await requestWordPressSitesUpdate(parsed.data.ids);

  return NextResponse.json({ success: true, count: result.count });
}
