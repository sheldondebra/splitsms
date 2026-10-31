import { NextResponse } from "next/server";
import { getRealSession, isAdminRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { setWordPressSiteStatus } from "@/lib/wordpress/admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRealSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const site = await prisma.wordPressSite.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  const nextStatus = site.status === "disconnected" ? "connected" : "disconnected";
  await setWordPressSiteStatus(id, nextStatus);

  return NextResponse.json({ success: true, status: nextStatus });
}
