import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.transaction.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  const header = "id,type,amount,currency,credits,description,date\n";
  const body = rows
    .map(
      (r) =>
        `${r.id},${r.type},${r.amount},${r.currency},${r.credits ?? ""},"${r.description ?? ""}",${r.createdAt.toISOString()}`,
    )
    .join("\n");

  return new NextResponse(header + body, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="splitsms-invoices.csv"',
    },
  });
}
