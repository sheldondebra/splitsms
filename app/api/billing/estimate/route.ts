import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { calculateSmsCost } from "@/lib/billing/calculator";
import { z } from "zod";

const schema = z.object({
  message: z.string(),
  recipients: z.union([z.string(), z.array(z.string())]),
  countryCode: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = schema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const estimate = await calculateSmsCost(session.userId, body.data);
  return NextResponse.json({ success: true, data: estimate });
}
