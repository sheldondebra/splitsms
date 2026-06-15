import { NextResponse } from "next/server";
import { submitSmartFormResponse } from "@/lib/smart-forms/public";
import { z } from "zod";

const bodySchema = z.object({
  values: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
  honeypot: z.string().optional(),
  source: z.string().optional(),
  captcha: z
    .object({
      a: z.number(),
      b: z.number(),
      answer: z.number(),
      token: z.string(),
    })
    .optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shortCode: string }> },
) {
  const { shortCode } = await params;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const result = await submitSmartFormResponse({
    shortCode,
    values: body.values,
    honeypot: body.honeypot,
    source: body.source,
    captcha: body.captcha,
  });

  if (!result.ok) {
    const status = result.error.includes("Too many submissions") ? 429 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
