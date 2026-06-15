import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { buildPublicFormUrl } from "@/lib/smart-forms/share";
import { getSiteUrl } from "@/lib/site-config";

async function requireForm(userId: string, formId: string) {
  return prisma.smartForm.findFirst({
    where: { id: formId, userId },
    select: { id: true, name: true, shortCode: true, status: true },
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ formId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { formId } = await params;
  const form = await requireForm(session.userId, formId);
  if (!form) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "png";
  const inline = url.searchParams.get("inline") === "1";
  const qrUrl = buildPublicFormUrl(getSiteUrl(), form.shortCode, { source: "qr" });
  const filename = `${form.shortCode}-qr`;

  if (format === "svg") {
    const svg = await QRCode.toString(qrUrl, { type: "svg", margin: 2, width: 512 });
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        ...(inline
          ? {}
          : { "Content-Disposition": `attachment; filename="${filename}.svg"` }),
      },
    });
  }

  const png = await QRCode.toBuffer(qrUrl, { type: "png", margin: 2, width: 512 });
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      ...(inline
        ? {}
        : { "Content-Disposition": `attachment; filename="${filename}.png"` }),
    },
  });
}
