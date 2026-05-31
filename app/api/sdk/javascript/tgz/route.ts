import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** npm-installable tarball when static /sdk/ files are missing or not yet deployed */
export async function GET() {
  const path = join(process.cwd(), "public/sdk/javascript/splitsms-sdk.tgz");
  if (!existsSync(path)) {
    return NextResponse.json(
      { error: "SDK not built — run npm run sync:sdks on the server or redeploy" },
      { status: 503 },
    );
  }

  const body = readFileSync(path);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/gzip",
      "Content-Disposition": 'attachment; filename="splitsms-sdk.tgz"',
      "Cache-Control": "public, max-age=3600, immutable",
    },
  });
}
