import { NextResponse } from "next/server";
import { getMarketingImage } from "@/lib/admin/email-marketing-images";

export const dynamic = "force-dynamic";

function parseDataUrl(raw: string): { content: Buffer; contentType: string } | null {
  const match = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) return null;
  return {
    contentType: match[1],
    content: Buffer.from(match[2].replace(/\s/g, ""), "base64"),
  };
}

/** Public — recipients' email clients and the browser fetch this with no session. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  const stored = await getMarketingImage("blob", filename);
  if (!stored) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = parseDataUrl(stored);
  if (!parsed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(parsed.content as BodyInit, {
    headers: {
      "Content-Type": parsed.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
