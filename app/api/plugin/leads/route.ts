import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { wordpressPlugin } from "@/lib/site-config";

const schema = z.object({
  name: z.string().trim().max(120).optional(),
  email: z.string().trim().toLowerCase().email().max(200),
  phone: z.string().trim().max(40).optional(),
  source: z.string().trim().max(60).optional(),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = await checkRateLimit(`plugin-lead:${ip}`, 10);
  if (!limit.ok) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Try again shortly." },
      { status: 429 },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  const { name, email, phone, source } = parsed.data;

  await prisma.wordPressPluginLead.create({
    data: {
      name: name || null,
      email,
      phone: phone || null,
      source: source || "wordpress-plugin",
      pluginVersion: wordpressPlugin.version,
      userAgent: request.headers.get("user-agent")?.slice(0, 300) || null,
    },
  });

  return NextResponse.json({
    success: true,
    download_url: wordpressPlugin.versionedDownloadUrl,
  });
}
