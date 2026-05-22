import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { buildContactWhere } from "@/lib/contacts/segment";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? undefined;
  const country = url.searchParams.get("country") ?? undefined;
  const tag = url.searchParams.get("tag") ?? undefined;
  const groupId = url.searchParams.get("groupId") ?? undefined;

  const contacts = await prisma.contact.findMany({
    where: buildContactWhere(session.userId, {
      q,
      countryCode: country ?? undefined,
      tag: tag ?? undefined,
      groupId: groupId ?? undefined,
    }),
    orderBy: { createdAt: "desc" },
  });

  const header = "name,phone,email,country,tags\n";
  const rows = contacts
    .map((c) => {
      const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
      return [
        esc(c.name ?? ""),
        esc(c.phone),
        esc(c.email ?? ""),
        esc(c.countryCode ?? ""),
        esc(c.tags ?? ""),
      ].join(",");
    })
    .join("\n");

  return new NextResponse(header + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="contacts.csv"',
    },
  });
}
