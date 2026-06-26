import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  countryBreakdownFromPreview,
  parseContactsCsv,
  parseContactsUpload,
} from "@/lib/contacts/csv-import";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "File required" }, { status: 400 });
      }
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });
      }
      const bytes = await file.arrayBuffer();
      const preview = parseContactsUpload(file.name, bytes);
      return NextResponse.json({
        ...preview,
        filename: file.name,
        countryBreakdown: countryBreakdownFromPreview(preview),
      });
    }

    const body = await req.json().catch(() => ({}));
    const csv = String(body.csv ?? "");
    if (!csv.trim()) {
      return NextResponse.json({ error: "CSV required" }, { status: 400 });
    }

    const preview = parseContactsCsv(csv);
    return NextResponse.json({
      ...preview,
      countryBreakdown: countryBreakdownFromPreview(preview),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not parse file" },
      { status: 400 },
    );
  }
}
