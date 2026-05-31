import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  try {
    const path = join(process.cwd(), "public/sdk/manifest.json");
    const body = readFileSync(path, "utf8");
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "SDK manifest not built — run npm run sync:sdks" }, { status: 503 });
  }
}
