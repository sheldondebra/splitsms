import { NextResponse } from "next/server";
import { getRealSession, isAdminRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { deleteWordPressPluginLead } from "@/lib/wordpress/admin";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRealSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const lead = await prisma.wordPressPluginLead.findUnique({ where: { id }, select: { id: true } });
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  await deleteWordPressPluginLead(id);

  return NextResponse.json({ success: true });
}
