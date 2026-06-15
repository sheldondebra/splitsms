import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { recordSmartFormEvent } from "@/lib/smart-forms/public";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ formId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { formId } = await params;
  const form = await prisma.smartForm.findFirst({
    where: { id: formId, userId: session.userId },
    select: { id: true, userId: true },
  });
  if (!form) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { channel?: string };
  try {
    body = await _req.json();
  } catch {
    body = {};
  }

  await recordSmartFormEvent(form.id, form.userId, "SHARE", {
    source: body.channel ?? "share",
  });

  return NextResponse.json({ ok: true });
}
